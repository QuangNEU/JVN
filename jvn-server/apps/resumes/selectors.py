from accounts.models import Account
from rest_framework.exceptions import ValidationError
from .models import CV,Tag

def get_cv_list_service(*,user :Account):
    if not hasattr(user, 'jobseeker'):
        raise ValidationError({'detail':'Chi co nguoi duung moi duoc lay cv'})
    return CV.objects.filter(jobseeker = user.jobseeker).only('title','file','created_at').order_by('-created_at')