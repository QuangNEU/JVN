import logging
from django.core.mail import EmailMessage
from django.conf import settings
from .models import Application
from email.utils import formataddr

logger = logging.getLogger(__name__)


def send_application_status_email(application: Application) -> None:
    """
    Gửi email thông báo trạng thái ứng tuyển. Không raise exception ra ngoài
    - nếu gửi mail lỗi thì chỉ log lại, KHÔNG được làm rollback việc đổi status
    (đổi status là hành động chính, email chỉ là phụ trợ).
    """
    applicant_account = application.applicant.account
    applicant_email = applicant_account.email
    applicant_name = applicant_account.name
    job_title = application.job_post.title
    company_name = application.job_post.company.account.name
    from_email = formataddr((f'{company_name} qua JVN', settings.DEFAULT_FROM_EMAIL))
    company_email = application.job_post.company.account.email

    templates = {
        Application.Status.INTERVIEWING: (
            f'Lịch phỏng vấn cho vị trí "{job_title}"',
            f'Chào {applicant_name},\n\n'
            f'Nhà tuyển dụng {company_name} mời bạn tham gia phỏng vấn cho vị trí "{job_title}" vào lúc '
            f'{application.interview_date.strftime("%H:%M ngày %d/%m/%Y") if application.interview_date else "(chưa xác định)"}.\n\n'
            f'Vui lòng chuẩn bị và phản hồi xác nhận với nhà tuyển dụng.\n\nTrân trọng,\nJVN Job Portal'
        ),
        Application.Status.HIRED: (
            f'Chúc mừng bạn đã trúng tuyển vị trí "{job_title}"',
            f'Chào {applicant_name},\n\n'
            f'Chúc mừng bạn đã trúng tuyển vị trí "{job_title}" tại {company_name}! '
            f'Nhà tuyển dụng sẽ liên hệ với bạn để trao đổi các bước tiếp theo.\n\nTrân trọng,\nJVN Job Portal'
        ),
        Application.Status.REJECTED: (
            f'Kết quả ứng tuyển vị trí "{job_title}"',
            f'Chào {applicant_name},\n\n'
            f'Cảm ơn bạn đã quan tâm và ứng tuyển vị trí "{job_title}" tại {company_name}. '
            f'Rất tiếc, hồ sơ của bạn chưa phù hợp ở thời điểm này'
            + (f'.\n\nLý do: {application.rejected_reason}' if application.rejected_reason else '.')
            + '\n\nChúc bạn sớm tìm được công việc phù hợp.\n\nTrân trọng,\nJVN Job Portal'
        ),
    }

    template = templates.get(application.status)
    if not template:
        return 

    subject, message = template
    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=formataddr((f'{company_name} qua JVN', settings.DEFAULT_FROM_EMAIL)),
        to=[applicant_email],
        reply_to=[company_email],
    )
    
    email.send(fail_silently=False)
    