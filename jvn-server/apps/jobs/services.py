from django.db import transaction
from accounts.models import Account
from core.permission import get_owned_or_403,have_role
from .models import Category,JobPost, SavedJob
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from resumes.models import Tag
from notifications.services import  create_notification_service, create_bulk_notification_service
from rest_framework.serializers import ValidationError
from django.utils import timezone
from . selectors import get_valid_leaf_categories
from accounts.selectors import get_company_verification_level
from core.validator import check_job_content

@transaction.atomic
def create_category_service(*, user: Account, data: dict):
    if user.role == Account.ROLE_CHOICES.COMPANY:
        company = user.company
        if get_company_verification_level(company=company) < 2:
            raise PermissionDenied({
                'detail': 'Vui lòng xác thực email và chứng nhận doanh nghiệp để tạo danh mục.'
            })
        status = Category.Status.PENDING
    elif user.role == Account.ROLE_CHOICES.ADMIN:
        status = Category.Status.APPROVED
    else:
        raise PermissionDenied({'detail': 'You dont have permission to create category'})

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
        status=status,
        created_by=user,
        parent=parent
    )
    return category


def deny_category_service(*,user:Account,category_id:int, reason: str):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,pk = category_id,  status=Category.Status.PENDING)
    category.status = Category.Status.REJECTED
    category.rejected_reason = reason
    category.save(update_fields=['status', 'rejected_reason', 'updated_at'])
    if category.created_by:
        create_notification_service(
            user= category.created_by,
            message= f'Category {category.title} đã bị từ chối bởi admin do {category.rejected_reason}',
            link='',
            send_email= True                        
        )
    return category

def approve_category_service(*,user: Account,category_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,pk=category_id,  status=Category.Status.PENDING)
    category.rejected_reason = None
    category.status = Category.Status.APPROVED
    category.save(update_fields=['status', 'rejected_reason', 'updated_at'])
    if category.created_by:
        create_notification_service(
            user= category.created_by,
            message= f'Category {category.title} đã được duyệt bởi admin',
            link=''                        
        )
    return category


def resubmit_category_service(*, user: Account,category_id:int, data: dict):
    have_role(user=user, role='company')
    category = get_object_or_404(Category, pk = category_id, created_by = user, status = Category.Status.REJECTED)
    category.title = data.get('title')
    category.parent = data.get('parent')
    category.status = Category.Status.PENDING
    category.rejected_reason = None
    category.save(update_fields=['title', 'parent', 'status', 'rejected_reason'])
    return category

@transaction.atomic
def create_post_service(*, user: Account, data: dict):
    have_role(user=user, role='company')
    company = user.company
    if get_company_verification_level(company=company) < 2:
        raise PermissionDenied({
            'detail': 'Please verify your email and business certificate for creating job post' 
        })
    
    is_suspicious, reason = check_job_content(data['title'], data['descriptions'])
    tag_ids = data.pop('tag_ids', [])
    category_ids = data.pop('category_ids', [])

    job_post = JobPost.objects.create(
        company=company,
        status=JobPost.STATUS.REJECTED if is_suspicious else JobPost.STATUS.PENDING,
        rejected_reason = reason,
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
    
    if is_suspicious:
        create_notification_service(
            user=user, message=f"Tin đăng bị từ chối: {reason}",
            link=f"/jobs/{job_post.id}",
        )

    return job_post

CONTENT_FIELDS = {'title', 'descriptions', 'requirement', 'benefit'}

@transaction.atomic
def update_post_service(*, user: Account, post_id: int, data: dict):
    job_post = get_object_or_404(JobPost, id=post_id, is_deleted=False)
    get_owned_or_403(user=user, profile_attr='company', obj=job_post, owner_field='company')

    tag_ids = data.pop('tag_ids', None)
    category_ids = data.pop('category_ids', None)

    content_changed = bool(CONTENT_FIELDS & data.keys())

    if data:
        for field, value in data.items():
            setattr(job_post, field, value)
        update_fields = list(data.keys())

        if content_changed:
            is_suspicious, reason = check_job_content(
                job_post.title, job_post.descriptions
            )
            job_post.status = JobPost.STATUS.REJECTED if is_suspicious else JobPost.STATUS.PENDING
            job_post.rejected_reason = reason
            update_fields += ['status', 'rejected_reason']

        job_post.save(update_fields=update_fields)

    if tag_ids is not None:
        tags = Tag.objects.filter(id__in=tag_ids)
        if tags.count() != len(set(tag_ids)):
            raise ValidationError({'tag_ids': 'Some tags do not exist'})
        job_post.tags.set(tags)

    if category_ids is not None:
        categories = get_valid_leaf_categories(category_ids)
        job_post.category.set(categories)

    if content_changed:
        if is_suspicious:
            create_notification_service(
                user=user, message=f"Tin đăng bị từ chối tự động: {reason}",
                link=f"/jobs/{job_post.id}", send_email=True,
            )
        else:
            create_bulk_notification_service(
                filter_kwargs={'role': Account.ROLE_CHOICES.ADMIN},
                message=f"Tin tuyển dụng vừa cập nhật cần duyệt lại: {job_post.title}",
                link=f"/admin/jobs/{job_post.id}",
            )

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

def approve_job_post_service(*,user: Account,job_post_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    job_post = get_object_or_404(JobPost,pk=job_post_id,  status=JobPost.STATUS.PENDING)
    job_post.rejected_reason = None
    job_post.status = JobPost.STATUS.PUBLISH
    job_post.save(update_fields=['status', 'rejected_reason', 'updated_at'])
    create_bulk_notification_service(
        filter_kwargs={'jobseeker__following__company': job_post.company.pk},
        message=f"{job_post.company.account.name} vừa đăng tin mới: {job_post.title}",
        link=f"/jobs/{job_post.id}",
    )
    return job_post
def reject_job_post_service(*, user: Account, job_post_id: int, reason: str):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'You dont have the permission'})
    
    job_post = get_object_or_404(JobPost, pk=job_post_id, status=JobPost.STATUS.PENDING)
    job_post.rejected_reason = reason
    job_post.status = JobPost.STATUS.REJECTED
    job_post.save(update_fields=['status', 'rejected_reason', 'updated_at'])  
    
    create_notification_service(
        user=job_post.company.account,
        message=f"Tin '{job_post.title}' đã bị từ chối: {reason}",
        link=f"/dashboard/jobs/{job_post.id}",
        send_email=True,  
    )
    return job_post