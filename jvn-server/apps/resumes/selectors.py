from accounts.models import Account
from rest_framework.exceptions import ValidationError
from .models import CV,Tag

def get_cv_list_service(*,user :Account,data:dict):
    if not hasattr(user, 'jobseeker'):
        raise ValidationError({'detail':'Chi co nguoi duung moi duoc lay cv'})
    return CV.objects.filter(jobseeker = user.jobseeker).order_by('-created_at')