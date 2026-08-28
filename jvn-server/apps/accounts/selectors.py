from django.shortcuts import get_object_or_404
from .models import Account, Company, Follow
from core.permission import have_role


def get_profile_detail_selector(*, account_id: int):
    # JOIN bảng ngay từ đầu bằng select_related
    user = get_object_or_404(
        Account.objects.select_related('jobseeker', 'company'), 
        pk=account_id
    )
    return user

def get_user_attr(user, attr_name:str):
    if user.role == Account.ROLE_CHOICES.SEEKER and hasattr(user, 'jobseeker'):
        return getattr(user.jobseeker, attr_name,None)
    elif user.role == Account.ROLE_CHOICES.COMPANY and hasattr(user,'company'):
        return getattr(user.company, attr_name,None)
    
def get_company_selector():
    company = Company.objects.all()
    return company 

def get_is_following(*, user, company_id):
    have_role(user = user, role ='jobseeker')
    company = Company.objects.get(pk = company_id)
    is_following = Follow.objects.filter(job_seeker = user.jobseeker, company = company).exists()
    return is_following

def get_follow_company_selector(*, user:Account):
    have_role(user=user, role='jobseeker')
    followed_company = Follow.objects.filter(job_seeker= user.jobseeker).select_related('company', 'company__account').order_by('-created_at')
    return followed_company

def get_company_verification_level(*, company: Company) -> int:
    if not company.account.email_verified:
        return 0
    if company.business_cert_status != Company.CertStatus.APPROVED:
        return 1
    return 2

def get_business_cert_list_selector(*,user:Account, status_filter):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        return PermissionError({'error':'You dont have the permission to read business cert'})
    quert_set = Company.objects.select_related('account')
    if status_filter:
        quert_set = quert_set.filter(business_cert_status = status_filter)
    return quert_set.exclude(business_cert_status=Company.CertStatus.NOT_SUBMITTED)
