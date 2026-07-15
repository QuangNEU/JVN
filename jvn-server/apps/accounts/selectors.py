from django.shortcuts import get_object_or_404
from .models import Account,JobSeeker,Company

def get_profile_detail_selector(*, account_id: int):
    # JOIN bảng ngay từ đầu bằng select_related
    user = get_object_or_404(
        Account.objects.select_related('jobseeker', 'company'), 
        pk=account_id
    )
    return user

def get_user_attr(user, attr_name:str):
    if user.role == 'SEEKER' and hasattr(user, 'jobseeker'):
        return getattr(user.jobseeker, attr_name,None)
    elif user.role == 'COMPANY'and hasattr(user,'company'):
        return getattr(user.company, attr_name,None)