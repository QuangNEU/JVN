from django.db import transaction
from accounts.models import Account
from core.permission import get_owned_or_403,have_role
from .models import Category,JobPost
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from resumes.models import Tag
from rest_framework.serializers import ValidationError
@transaction.atomic
def create_category_service(*, user:Account, data:dict):
    have_role(user=user,role ='company')
    parent = None
    if data.get('parent_id'):
        parent = get_object_or_404(Category, id=data.parent_id)
    category=Category.objects.create(
        title=data.get('title'),
        status=Category.Status.PENDING,
        created_by = user,
        parent = parent
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
def create_post_service(*,user :Account,data:dict):
    have_role(user=user,role='company')
    company =user.company
    tag_ids = data.pop('tag_ids',[])
    category_ids = data.pop('category_ids',[])

    job_post = JobPost.objects.create(company=company,**data)
    if tag_ids:
        tags = Tag.objects.filter(id__in = tag_ids)
        if tags.count() != len(set(tag_ids)):
            raise ValidationError({'error':'Some tags is not exists'})
        job_post.tags.set(tags)
    
    if category_ids:
        categories = Category.objects.filter(id__in = category_ids, status = Category.Status.APPROVED)
        if categories.count() != len(set(category_ids)):
            raise ValidationError({'error':'Some category is not exists'})
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
        categories = Category.objects.filter(id__in=category_ids, status='APPROVED')
        if categories.count() != len(set(category_ids)):
            raise ValidationError({'error': 'Some category is not exists or not approved'})
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