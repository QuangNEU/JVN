from django.db.models import OuterRef, Subquery, Count, Case, When, Value, IntegerField, F, Sum, Q
from django.db.models.functions import Coalesce
from accounts.models import Company, Follow, Account, JobSeeker
from jobs.models import JobPost, SavedJob
from applications.models import Application
from django.utils import timezone
from datetime import timedelta
from core.permission import have_role


def _annotate_company_score(queryset):
    followers_sq = (
        Follow.objects.filter(company_id=OuterRef('account_id'))
        .values('company_id').annotate(c=Count('id')).values('c')
    )
    jobs_sq = (
        JobPost.objects.filter(company_id=OuterRef('account_id'), status='PUBLISHED', is_deleted=False)
        .values('company_id').annotate(c=Count('id')).values('c')
    )
    applications_sq = (
        Application.objects.filter(job_post__company_id=OuterRef('account_id'))
        .values('job_post__company_id').annotate(c=Count('id')).values('c')
    )
    saved_sq = (
        SavedJob.objects.filter(job_post__company_id=OuterRef('account_id'))
        .values('job_post__company_id').annotate(c=Count('id')).values('c')
    )

    promoted_bonus = Case(When(is_promoted=True, then=Value(10000)), default=Value(0), output_field=IntegerField())

    return queryset.annotate(
        followers_count=Coalesce(Subquery(followers_sq, output_field=IntegerField()), 0),
        active_jobs_count=Coalesce(Subquery(jobs_sq, output_field=IntegerField()), 0),
        applications_count=Coalesce(Subquery(applications_sq, output_field=IntegerField()), 0),
        saved_count=Coalesce(Subquery(saved_sq, output_field=IntegerField()), 0),
    ).annotate(
        score=promoted_bonus
        + F('followers_count') * 3
        + F('active_jobs_count') * 2
        + F('applications_count') * 1
        + F('saved_count') * 1
    )


def get_featured_companies_selector(*, limit: int = 10):
    queryset = _annotate_company_score(Company.objects.select_related('account'))
    return queryset.order_by('-score')[:limit]


def search_companies_selector(*, filters: dict = None):
    filters = filters or {}
    queryset = _annotate_company_score(Company.objects.select_related('account'))

    keyword = filters.get('keyword')
    if keyword:
        queryset = queryset.filter(account__name__icontains=keyword)

    industry = filters.get('industry')
    if industry:
        queryset = queryset.filter(industry__icontains=industry)

    province = filters.get('province')
    if province:
        queryset = queryset.filter(province__icontains=province)

    return queryset.order_by('-score')


def get_company_detail_selector(*, company_id: int):
    queryset = _annotate_company_score(Company.objects.select_related('account'))
    return queryset.filter(account_id=company_id).first()

def get_company_dashboard_summary_selector(*, user: Account):
    have_role(user=user, role=Account.ROLE_CHOICES.COMPANY)
    company = user.company

    active_job_count = JobPost.objects.filter(
        company=company, status=JobPost.STATUS.PUBLISH
    ).count()

    job_ids = JobPost.objects.filter(company=company).values_list('id', flat=True)
    total_applications = Application.objects.filter(job_post_id__in=job_ids).count()

    total_views = JobPost.objects.filter(company=company).aggregate(
        total=Sum('view_count')
    )['total'] or 0

    return {
        'active_job_count': active_job_count,
        'total_applications': total_applications,
        'total_views': total_views,
    }

def get_application_status_breakdown_selector(*, user: Account):
    have_role(user=user, role='company')
    company = user.company

    raw_counts = dict(
        Application.objects.filter(
            job_post__company = company,
            job_post__is_deleted = False
        ).values('status').annotate(c = Count('id')).values_list('status', 'c')
    )

    return [
        {'status': choice, 'label': label, 'count': raw_counts.get(choice, 0)}
        for choice, label in Application.Status.choices
    ]

def get_jobs_pending_review_selector(*, user: Account):
    have_role(user= user, role='company')
    company = user.company

    pending_jobposts = JobPost.objects.filter(
        company = company,
        status = JobPost.STATUS.PUBLISH,
        is_deleted = False
    ).annotate(
        pending_count = Count(
            'applications', filter=Q(applications__status__in = [Application.Status.SENT, Application.Status.RECEIVED])
        )
    ).filter(pending_count__gt = 0).order_by('-pending_count')[:5]

    return pending_jobposts

def get_system_overview_selector(*, user: Account):
    have_role(user= user, role= Account.ROLE_CHOICES.ADMIN)

    data = {
        'total_companies': Company.objects.count(),
        'total_seekers': JobSeeker.objects.count(),
        'total_active_jobs': JobPost.objects.filter(
            status=JobPost.STATUS.PUBLISH, is_deleted=False
        ).count(),
        'total_applications': Application.objects.count(),
    }
    
    return data

def get_job_conversion_selector(*, user:Account, min_age_days: int = 3):
    have_role(user= user, role= Account.ROLE_CHOICES.ADMIN)
    
    cutoff_date = timezone.localdate() - timedelta(days=min_age_days)

    active_job = JobPost.objects.filter(
        status = JobPost.STATUS.PUBLISH, 
        is_deleted = False, 
        date_posted__isnull=False,
        date_posted__lte=cutoff_date,)
    total = active_job.count()
    job_with_application = active_job.annotate(
        app_count = Count('applications')
    ).filter(app_count__gt = 0).count()
    return {
        'total_jobs': total,
        'jobs_with_applications': job_with_application,
        'jobs_without_applications': total - job_with_application,
        'conversion_rate': round(job_with_application/total *100,2) if total>0 else 0 
    }


