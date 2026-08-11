import cloudinary.uploader
from django.db import transaction
from .models import CV,Tag
from accounts.models import Account
from rest_framework.exceptions import ValidationError,PermissionDenied
from django.shortcuts import get_object_or_404
from core.permission import get_owned_or_403
from core.validator import validate_file

@transaction.atomic
def create_cv_service(*,user:Account, data:dict):
    if user.role != Account.ROLE_CHOICES.SEEKER:
        raise ValidationError({'detail':'Chi ung vien moi co the tai len CV'})
    file_obj = data.get('file')
    if file_obj:
        validate_file(file_obj)
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
    if user.role != Account.ROLE_CHOICES.SEEKER:
        raise PermissionDenied({'detail':'Chi ung vien moi co the xoa CV'})
    jobseeker = user.jobseeker
    cv = get_object_or_404(CV,id= cv_id)
    if cv.job_seeker != jobseeker:
        raise PermissionDenied({'detail':'Chi co chu so huu moi co the xoa'})
    if cv.file:
        try:
            cloudinary.uploader.destroy(cv.file.name)
        except Exception as e:
            print(f'Lỗi {e}: Không thể xóa file trên cloudinary')
    cv.delete()
    return True

@transaction.atomic
def set_default_service(*,user:Account,cv_id:int):
    if not hasattr(user,'jobseeker'):
        raise PermissionDenied({'detail':'Khong co quyen han'})
    job_seeker = user.jobseeker

    cv = get_object_or_404(CV,id=cv_id)
    if cv.job_seeker != job_seeker:
        raise PermissionDenied({'detail':'Khong co quyen han'})
    
    CV.objects.filter(job_seeker = job_seeker, is_default = True).update(is_default = False)
    cv.is_default = True
    cv.save(update_fields=['is_default'])
    return cv

@transaction.atomic
def update_cv_service(*,user:Account,data:dict,cv_id:int):
    cv = get_object_or_404(CV,id = cv_id)
    get_owned_or_403(user=user,profile_attr='jobseeker',obj=cv,owner_field='job_seeker')
    if 'file' in data:
        new_file = data.pop('file')
        if new_file:
            validate_file(new_file)
            
        if cv.file:
            try:
                cloudinary.uploader.destroy(cv.file.name)
            except Exception as e:
                print(f'Loi {e} khong the xoa file cu tren cloudinary')
        cv.file = new_file

    for field, value in data.items():
        if field != 'tag_ids':
            setattr(cv, field, value)
    cv.save()

    if 'tag_ids' in data:
        tag_ids = data['tag_ids']
        tags = Tag.objects.filter(id__in=tag_ids)
        if tags.count() != len(set(tag_ids)):
            raise ValidationError({'tag_ids': 'Mot so tag_id khong ton tai'})
        cv.tags.set(tags)

    return cv

def public_cv_service(*,user:Account,cv_id:int):
    cv = get_object_or_404(CV,id = cv_id)
    get_owned_or_403(user=user,profile_attr='jobseeker',obj=cv,owner_field='job_seeker')
    cv.is_public = not cv.is_public
    cv.save(update_fields=['is_public'])
    return cv 