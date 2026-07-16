from django.db import transaction
from .models import CV,Tag
from accounts.models import Account
from rest_framework.exceptions import ValidationError

@transaction.atomic
def create_cv_service(*,user:Account, data:dict):
    if user.role != 'SEEKER':
        raise ValidationError({'detail':'Chi ung vien moi co the tai len CV'})
    job_seeker = user.jobseeker
    cv = CV.objects.create(
        job_seeker = job_seeker,
        title = data.get('title'),
        level = data.get('level'),
        file = data.get('file'),
    )
    tag_ids = data.get('tag_ids')
    if tag_ids:
        tags = Tag.objects.filter(id__in=tag_ids)
        cv.tags.set(tags)
    return cv    

