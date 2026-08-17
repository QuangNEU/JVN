from django.db.models import OuterRef, Subquery, Count, Case, When, Value, IntegerField, F
from django.db.models.functions import Coalesce
from accounts.models import Company, Follow
from jobs.models import JobPost, SavedJob
from applications.models import Application


def _annotate_company_score(queryset):
    """
    Dùng Subquery riêng cho từng loại đếm (KHÔNG dùng nhiều Count() cùng lúc trên
    nhiều quan hệ join trong 1 queryset) - đây là bug rất hay gặp trong Django:
    join nhiều bảng 1-N cùng lúc rồi Count() sẽ nhân chéo (fan-out), ra số liệu sai
    (VD: company có 3 job + 5 follow sẽ ra follow_count = 15 thay vì 5).
    Subquery độc lập tránh hoàn toàn vấn đề này, dù tốn thêm vài query con.
    """
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