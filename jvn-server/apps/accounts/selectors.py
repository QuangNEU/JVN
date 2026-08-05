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
    have_role(user, 'jobseeker')
    company = Company.objects.get(pk = company_id)
    is_following = Follow.objects.filter(job_seeker = user.jobseeker, company = company).exists()
    return is_following