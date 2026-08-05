from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError
from accounts.models import Account
from jobs.models import JobPost
from core.permission import have_role, get_owned_or_403
from .models import Application
from django.shortcuts import get_object_or_404
from.tasks import send_application_status_email_task

@transaction.atomic
def apply_job_services(*,user:Account,job_post_id:int, data:dict):
    have_role(user=user,role='jobseeker')
    job_seeker = user.jobseeker
    job_post = get_object_or_404(JobPost, pk=job_post_id)
    if(job_post.status != JobPost.STATUS.PUBLISH):
        raise PermissionDenied({'error': 'You dont have permission to access this post'})
    
    if Application.objects.filter(applicant=job_seeker,job_post = job_post).exists():
        raise ValidationError({'error': 'You have applied this job.'})
    
    application = Application.objects.create(
        applicant=job_seeker,
        job_post=job_post,
        cv_id=data.get('cv_id'), 
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

    transaction.on_commit(lambda: send_application_status_email_task.delay(application.id))
    return application


    
