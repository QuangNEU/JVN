from django.shortcuts import get_object_or_404
from .models import Account, Company, Follow, AccountLockHistory
from core.permission import have_role
from rest_framework.exceptions import PermissionDenied


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
        raise PermissionDenied({'detail':'You dont have the permission to read business cert'})
    quert_set = Company.objects.select_related('account').order_by('-account__date_joined')
    if status_filter:
        quert_set = quert_set.filter(business_cert_status = status_filter)
    return quert_set.exclude(business_cert_status=Company.CertStatus.NOT_SUBMITTED)


def get_admin_account_list_selector(*,user: Account, role_filter = None, is_locked_filter = None):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission to get account list'})
    
    query_set = Account.objects.exclude(role = Account.ROLE_CHOICES.ADMIN).order_by('-date_joined')
    if role_filter:
        query_set = query_set.filter(role = role_filter)
    if is_locked_filter:
        query_set = query_set.filter(is_locked = is_locked_filter)
    return query_set


def get_account_lock_history_selector(*, user: Account, account_id: int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'You dont have the permission'})

    return AccountLockHistory.objects.filter(account_id=account_id).select_related('performed_by').order_by('-created_at')