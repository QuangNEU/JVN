from .models import Category
from core.permission import have_role
from .models import JobPost
from accounts.models import Account
from django.shortcuts import get_object_or_404
from core.permission import get_owned_or_403

def get_approved_category_service():
    categories = Category.objects.filter(status = Category.Status.APPROVED).select_related('parent')
    return categories 

def get_pending_category_service():
    categories = Category.objects.filter(status = Category.Status.PENDING).select_related('parent')
    return categories

def company_read_post_service(*,user:Account):
    have_role(user=user,role='company')
    job_post = JobPost.objects.filter(company = user.company).prefetch_related('tags', 'category').order_by('-date_posted')
    return job_post

def public_read_post_service():
    job_posts = JobPost.objects.filter(status = JobPost.STATUS.PUBLISH, is_deleted =  False).prefetch_related('tags','category').order_by('-date_posted')
    return job_posts

def get_post_detail_selector(*, user:Account, post_id:int):
    job_post = get_object_or_404(JobPost.objects.prefetch_related('tags','category'), id = post_id, is_deleted=False)
    if job_post.status == JobPost.STATUS.PUBLISH:
        return job_post
    elif get_owned_or_403(user=user,profile_attr='company',obj=job_post,owner_field='company'):
        return job_post
    
    raise PermissionError({'message':'You dont have the permission the read this post'})