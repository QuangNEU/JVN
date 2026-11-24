from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from accounts.models import Account
from jobs.models import JobPost
from resumes.models import CV
from notifications.services import create_notification_service
from core.permission import have_role, get_owned_or_403
from .models import Application
from.tasks import send_application_status_email_task

@transaction.atomic
def apply_job_services(*,user:Account,job_post_id:int, data:dict):
    have_role(user=user,role='jobseeker')
    job_seeker = user.jobseeker
    job_post = get_object_or_404(JobPost, pk=job_post_id, is_deleted=False)
    if(job_post.status != JobPost.STATUS.PUBLISH):
        raise PermissionDenied({'detail': 'You dont have permission to access this post'})
    
    if job_post.expiration_date and job_post.expiration_date < timezone.localdate():
        raise ValidationError({'detail': 'This job post has expired.'})

    cv = get_object_or_404(CV, pk=data.get('cv_id'))
    if cv.job_seeker != job_seeker:
        raise PermissionDenied({'detail': 'You dont have permission to use this CV.'})

    if Application.objects.filter(applicant=job_seeker,job_post = job_post).exists():
        raise ValidationError({'detail': 'You have applied this job.'})
    
    application = Application.objects.create(
        applicant=job_seeker,
        job_post=job_post,
        cv=cv, 
        cover_letter=data.get('cover_letter', '')
    )
    return application

@transaction.atomic
def update_application_status(*, user: Account,data: dict, application_id):
    have_role(user=user, role = 'company')
    application = get_object_or_404(Application,pk = application_id, job_post__company = user.company)
    status_val = data.get('status')
    application.status = status_val
    updated_field = ['status', 'updated_at']

    if status_val == Application.Status.INTERVIEWING:
        application.interview_date = data.get('interview_date')
        updated_field.append('interview_date')
    if status_val == Application.Status.REJECTED:
        application.rejected_reason = data.get('rejected_reason')
        updated_field.append('rejected_reason')
    application.save(update_fields=updated_field)

    job_title = application.job_post.title
    notification_message = get_application_status_message(status_val, job_title)

    create_notification_service(
        user=application.applicant.account,
        message=notification_message,
        link=f'/jobs/{application.job_post.id}',
        send_email=False
    )

    transaction.on_commit(lambda: send_application_status_email_task.delay(application.id))
    return application

def get_application_status_message(status_val, job_title):
    messages = {
        Application.Status.SENT: f"Hồ sơ của bạn đã được gửi thành công ứng tuyển công việc {job_title}. Hãy cùng chờ tin tốt nhé!",
        Application.Status.RECEIVED: f"Nhà tuyển dụng đã tiếp nhận hồ sơ của bạn cho công việc {job_title} và sẽ sớm phản hồi.",
        Application.Status.WATCHED: f"Nhà tuyển dụng vừa xem CV của bạn cho công việc {job_title}.",
        Application.Status.SUITABLE: f"Tin vui! Hồ sơ của bạn cho công việc {job_title} được đánh giá là rất phù hợp. Hãy chuẩn bị tinh thần cho bước tiếp theo nhé.",
        Application.Status.INTERVIEWING: f"Chúc mừng! Nhà tuyển dụng muốn mời bạn tham gia phỏng vấn cho công việc {job_title}.",
        Application.Status.HIRED: f"Tuyệt vời! Bạn đã trúng tuyển công việc {job_title}. Chúc bạn có một hành trình công việc thật bùng nổ!",
        Application.Status.REJECTED: f"Rất tiếc, hồ sơ ứng tuyển {job_title} của bạn chưa phù hợp ở thời điểm hiện tại. Đừng nản lòng, vẫn còn rất nhiều cơ hội khác đang chờ bạn!"
    }
    
    # Trả về message tương ứng, nếu không có thì dùng câu mặc định
    return messages.get(status_val, f"Trạng thái hồ sơ vị trí {job_title} của bạn vừa được cập nhật.")