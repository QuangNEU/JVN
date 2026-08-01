from .models import Category
from core.permission import have_role
from .models import JobPost
from accounts.models import Account
from django.shortcuts import get_object_or_404
from core.permission import get_owned_or_403
from django.db.models import Q 
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

def get_approved_category_service():
    categories = Category.objects.filter(status = Category.Status.APPROVED).select_related('parent')
    return categories 

def get_pending_category_service(*,user:Account):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'Dont have permission'})
    categories = Category.objects.filter(status = Category.Status.PENDING).select_related('parent')
    return categories

def company_read_post_service(*,user:Account, status_filter = None):
    have_role(user=user,role='company')
    job_post = JobPost.objects.filter(
        company=user.company,
        is_deleted=False,
    ).prefetch_related('tags', 'category').order_by('-date_posted')
    if (status_filter):
        job_post = job_post.filter(status = status_filter)
    return job_post

def public_read_post_service(*, filters: dict = None):
    queryset = JobPost.objects.filter(
        status='PUBLISHED', is_deleted=False
    ).filter(
        Q(expiration_date__isnull=True) | Q(expiration_date__gt=timezone.now())
    ).select_related('company', 'company__account').prefetch_related('tags', 'category')

    filters = filters or {}

    keyword = filters.get('keyword')
    if keyword:
        queryset = queryset.filter(
            Q(title__icontains=keyword) |
            Q(descriptions__icontains=keyword) |
            Q(requirement__icontains=keyword)
        )

    location = filters.get('location')
    if location:
        queryset = queryset.filter(
            Q(company__province__icontains=location) |
            Q(company__ward__icontains=location)
        )

    salary_min = filters.get('salary_min')
    if salary_min:
        queryset = queryset.filter(salary_max__gte=salary_min)

    salary_max = filters.get('salary_max')
    if salary_max:
        queryset = queryset.filter(salary_min__lte=salary_max)

    level = filters.get('level')
    if level:
        queryset = queryset.filter(level=level)

    job_type = filters.get('type')
    if job_type:
        queryset = queryset.filter(type=job_type)

    category_id = filters.get('category_id')
    if category_id:
        queryset = queryset.filter(category__id=category_id)

    return queryset.order_by('-date_posted')

def get_post_detail_selector(*, user:Account, post_id:int):
    job_post = get_object_or_404(JobPost.objects.prefetch_related('tags','category'), id = post_id, is_deleted=False)
    is_public = (
        job_post.status == JobPost.STATUS.PUBLISH
        and (
            job_post.expiration_date is None
            or job_post.expiration_date > timezone.now()
        )
    )
    if is_public:
        return job_post
    elif get_owned_or_403(user=user,profile_attr='company',obj=job_post,owner_field='company'):
        return job_post
    
    raise PermissionDenied({'message':'You dont have the permission the read this post'})
