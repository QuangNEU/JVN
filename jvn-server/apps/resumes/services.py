import cloudinary.uploader
from django.db import transaction
from .models import CV,Tag
from accounts.models import Account
from rest_framework.exceptions import ValidationError,PermissionDenied
from django.shortcuts import get_object_or_404

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

@transaction.atomic
def delete_cv_service(*,user:Account,cv_id:int):
    if user.role != 'SEEKER':
        raise PermissionDenied({'detail':'Chi ung vien moi co the xoa CV'})
    jobseeker = user.jobseerker
    cv = get_object_or_404(CV,id= cv_id)
    if cv.job_seeker != user.jobseeker:
        raise PermissionDenied({'detail':'Chi co chu so huu moi co the xoa'})
    if cv.file:
        try:
            public_id = cv.file.public_id
            cloudinary.uploader.destroy(public_id)
        except Exception as e:
            pass
    cv.delete()
    return True