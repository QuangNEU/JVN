from accounts.models import Account
from rest_framework.exceptions import ValidationError,PermissionDenied
from django.shortcuts import get_object_or_404
from .models import CV,Tag

def get_cv_list_service(*,user :Account):
    if not hasattr(user, 'jobseeker'):
        raise PermissionDenied({'detail':'Chi co nguoi duung moi duoc lay cv'})
    return CV.objects.filter(jobseeker = user.jobseeker).only('title','file','created_at').order_by('-created_at')

def get_cv_selector(*,user:Account,cv_id :int):
    if not hasattr(user,'jobseeker'):
        raise PermissionDenied({'detail':'Chi co nguoi dung moi xem duoc CV nay'})
    cv = get_object_or_404(CV,id = cv_id)
    if cv.job_seeker != user.jobseeker:
        raise PermissionDenied('Ban khong co quyen xem CV cua nguoi khac')
    return cv

def get_tag():
    tags = Tag.objects.all()
    return tags