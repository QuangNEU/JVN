from accounts.models import Account
from core.permission import have_role
from .models import Application
from django.shortcuts import get_object_or_404
from jobs.models import JobPost
from rest_framework.exceptions import PermissionDenied
def get_my_applications_selector(*, user:Account, status_filter = None):
    have_role(user= user, role= 'jobseeker')
    my_applications = Application.objects.filter(applicant = user.jobseeker).order_by('-date_applied')
    if status_filter:
        my_applications = my_applications.filter(status = status_filter)
    return my_applications

def get_job_application_selector(*, user:Account, job_post_id, status_filter = None):
    have_role(user= user,role= 'company')
    job_post = get_object_or_404(JobPost, pk = job_post_id, company = user.company)
    job_application = Application.objects.filter(job_post = job_post).order_by('-date_applied')
    if status_filter:
        job_application = job_application.filter(status = status_filter)
    return job_application

def is_applied_selector(*, user: Account, job_post_id: int) -> bool:
    if not user.is_authenticated or not hasattr(user, 'jobseeker'):
        return False
    return Application.objects.filter(
        job_post_id=job_post_id, applicant=user.jobseeker
    ).exists()

def get_applied_job_ids_selector(*, user: Account, job_post_ids: list[int]) -> set[int]:
    if not user.is_authenticated or not hasattr(user, 'jobseeker'):
        return set()

    return set(
        Application.objects.filter(
            job_post_id__in=job_post_ids, applicant=user.jobseeker
        ).values_list('job_post_id', flat=True)
    )