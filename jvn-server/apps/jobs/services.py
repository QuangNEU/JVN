from django.db import transaction
from accounts.models import Account
from core.permission import get_owned_or_403,have_role
from .models import Category,JobPost, SavedJob
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from resumes.models import Tag
from rest_framework.serializers import ValidationError
from django.utils import timezone
from . selectors import get_valid_leaf_categories
from accounts.selectors import get_company_verification_level

@transaction.atomic
def create_category_service(*, user: Account, data: dict):
    have_role(user=user, role='company')
    company = user.company
    if get_company_verification_level(company=company) < 2:
        raise PermissionDenied({
            'detail': 'Please verify your email and business certificate for creating category' 
        })

    parent = None
    parent_id = data.get('parent_id')

    if parent_id:
        parent = get_object_or_404(
            Category, id=parent_id, status=Category.Status.APPROVED
        )
        if parent.parent_id is not None:
            raise ValidationError({
                'error': 'Không thể chọn category con làm cha — hệ thống chỉ hỗ trợ 2 cấp'
            })

    category = Category.objects.create(
        title=data.get('title'),
        status=Category.Status.PENDING,
        created_by=user,
        parent=parent
    )
    return category


def deny_category_service(*,user:Account,category_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,pk = category_id)
    category.status = Category.Status.REJECTED
    category.save(update_fields=['status'])
    return {
        'message':'Tu choi thanh cong'
    }

def approve_category_service(*,user: Account,category_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,pk=category_id)
    category.status = Category.Status.APPROVED
    category.save(update_fields=['status'])
    return{
        'message':'Da dong y'
    }

@transaction.atomic
def create_post_service(*, user: Account, data: dict):
    have_role(user=user, role='company')
    company = user.company
    if get_company_verification_level(company=company) < 2:
        raise PermissionDenied({
            'detail': 'Please verify your email and business certificate for creating job post' 
        })
    tag_ids = data.pop('tag_ids', [])
    category_ids = data.pop('category_ids', [])

    job_post = JobPost.objects.create(
        company=company,
        status=JobPost.STATUS.PUBLISH,
        date_posted=timezone.now(),
        **data
    )
    if tag_ids:
        tags = Tag.objects.filter(id__in=tag_ids)
        if tags.count() != len(set(tag_ids)):
            raise ValidationError({'detail': 'Some tags is not exists'})
        job_post.tags.set(tags)

    if category_ids:
        categories = get_valid_leaf_categories(category_ids)   # ← thay đoạn cũ
        job_post.category.set(categories)
    return job_post

@transaction.atomic
def update_post_service(*, user:Account, post_id:int, data :dict):
    job_post = get_object_or_404(JobPost,id = post_id)
    get_owned_or_403(user=user,profile_attr='company',obj=job_post,owner_field='company')

    tag_ids = data.pop('tag_ids',None)
    category_ids = data.pop('category_ids',None)

    if data:
        for field,value in data.items():
            setattr(job_post,field,value)
        job_post.save(update_fields=list(data.keys()))

    if tag_ids is not None:
        tags = Tag.objects.filter(id__in = tag_ids)
        if tags.count() != len(set(tag_ids)):
            raise ValidationError({'error': 'Some tags is not exists'})
        job_post.tags.set(tags)
    
    if category_ids is not None:
        categories = get_valid_leaf_categories(category_ids)   # ← thay đoạn cũ
        job_post.category.set(categories)
    return job_post

@transaction.atomic
def delete_post_service(*, user:Account, post_id: int):
    job_post = get_object_or_404(JobPost,id = post_id)
    get_owned_or_403(user=user, profile_attr='company', obj=job_post, owner_field='company')
    job_post.is_deleted = True
    job_post.status = JobPost.STATUS.CLOSED
    job_post.save(update_fields=['is_deleted', 'status'])
    return job_post

@transaction.atomic
def save_job_service(*, user: Account, job_post_id):
    have_role(user = user, role = 'jobseeker')
    job_post = get_object_or_404(JobPost, pk=job_post_id)
    job_seeker = user.jobseeker
    save_record = SavedJob.objects.filter(job_post= job_post, job_seeker= job_seeker).first()

    if save_record:
        save_record.delete()
        is_saved = False
        message = f'Đã bỏ lưu tin "{job_post.title}"'
    else:
        SavedJob.objects.create(job_seeker= job_seeker, job_post= job_post)
        is_saved = True
        message = f'Đã lưu tin "{job_post.title}"'
        
    return {'is_saved': is_saved, 'message': message}