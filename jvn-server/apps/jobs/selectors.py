from .models import Category
from core.permission import have_role
from .models import JobPost, SavedJob
from accounts.models import Account
from datetime import timedelta
from django.shortcuts import get_object_or_404
from core.permission import get_owned_or_403
from django.db.models import Q, Count, Prefetch,F
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError


def get_valid_leaf_categories(category_ids: list[int]):
    categories = Category.objects.filter(
        id__in=category_ids,
        status=Category.Status.APPROVED
    ).annotate(
        approved_children_count=Count(
            'children', filter=Q(children__status=Category.Status.APPROVED)
        )
    ).filter(approved_children_count=0)

    if categories.count() != len(set(category_ids)):
        raise ValidationError({
            'error': 'Một số category không hợp lệ, chưa được duyệt, hoặc là category nhóm (cần chọn category cụ thể hơn)'
        })
    return categories

def get_my_category_requests_selector(*,user: Account, status_filter):
    have_role(user= user, role = 'company')
    category = Category.objects.filter(created_by = user).order_by('-created_at')
    if status_filter:
        category = category.filter(status = status_filter)
    return category

def get_approved_category_service():
    return Category.objects.filter(
        status=Category.Status.APPROVED,
        parent__isnull=True
    ).prefetch_related(
        Prefetch(
            'children',
            queryset=Category.objects.filter(status=Category.Status.APPROVED),
        )
    )

def get_admin_category_service(*,user:Account, status_filter = None):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'Dont have permission'})
    categories = Category.objects.all().order_by('-created_at')
    if status_filter not in Category.Status.values:
            raise ValidationError({
                'status': f'Giá trị không hợp lệ. Chỉ chấp nhận: {", ".join(Category.Status.values)}'
            })
    categories = categories.filter(status=status_filter)
    return categories

def expand_category_ids(category_ids: list[int]) -> list[int]:
    child_ids = Category.objects.filter(
        parent_id__in=category_ids, status=Category.Status.APPROVED
    ).values_list('id', flat=True)
    return list(set(category_ids) | set(child_ids))

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
        Q(expiration_date__isnull=True) | Q(expiration_date__gt=timezone.localdate())
    ).select_related('company', 'company__account').prefetch_related('tags', 'category')

    filters = filters or {}

    keyword = filters.get('keyword')
    if keyword:
        queryset = queryset.filter(
            Q(title__icontains=keyword) |
            # Q(descriptions__icontains=keyword) |
            # Q(requirement__icontains=keyword) |
            Q(company__account__name__icontains=keyword)
        )

    locations = filters.get('locations')
    if locations:
        location_q = Q()
        for loc in locations:
            location_q |= Q(company__province__icontains=loc) | Q(company__ward__icontains=loc)
        queryset = queryset.filter(location_q)
    
    company_id = filters.get('company_id')
    if company_id:
        queryset = queryset.filter(company_id=company_id)

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

    category_ids = filters.get('category_ids')  
    if category_ids:
        expanded_ids = expand_category_ids(category_ids)
        queryset = queryset.filter(category__id__in=expanded_ids).distinct()

    return queryset.order_by('-date_posted')

def get_post_detail_selector(*, user: Account, post_id: int):
    job_post = get_object_or_404(
        JobPost.objects.prefetch_related('tags', 'category'), id=post_id, is_deleted=False
    )

    is_public = (
        job_post.status == JobPost.STATUS.PUBLISH
        and (job_post.expiration_date is None or job_post.expiration_date > timezone.localdate())
    )

    is_owner = (
        user.is_authenticated
        and hasattr(user, 'company')
        and job_post.company_id == user.company.pk
    )

    if not is_public and not is_owner:
        raise PermissionDenied({'detail': 'You dont have the permission the read this post'})

    if is_public and not is_owner:
        JobPost.objects.filter(pk=post_id).update(view_count=F('view_count') + 1)
        job_post.refresh_from_db(fields=['view_count'])

    return job_post

def is_saved_selector(*, user: Account, job_post_id):
    if not user.is_authenticated or user.role != Account.ROLE_CHOICES.SEEKER:
        return False
    is_saved = SavedJob.objects.filter(job_seeker = user.jobseeker, job_post = job_post_id).exists()
    return is_saved

def get_saved_job_selector(*, user:Account):
    have_role(user= user, role= 'jobseeker')
    saved_job = SavedJob.objects.filter(job_seeker = user.jobseeker).select_related('job_post', 'job_post__company', 'job_post__company__account').prefetch_related('job_post__tags', 'job_post__category').order_by('-created_at')
    return saved_job

def get_expring_soon_jobs_selectors(*, user:Account, days: int=3):
    have_role(user= user,role=Account.ROLE_CHOICES.COMPANY)
    company = user.company
    today  = timezone.localdate()

    return JobPost.objects.filter(
        company = company,
        status = JobPost.STATUS.PUBLISH,
        is_deleted = False,
        expiration_date__isnull = False,
        expiration_date__gte = today,
        expiration_date__lte = today + timedelta(days)
    ).order_by('expiration_date')[:5]

def get_admin_job_post_selector(*, user: Account, status_filter=None):
    have_role(user=user, role=Account.ROLE_CHOICES.ADMIN)
    queryset = JobPost.objects.filter(is_deleted=False).prefetch_related('tags', 'category').order_by('-date_posted')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    return queryset