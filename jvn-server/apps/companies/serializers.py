from rest_framework import serializers
from accounts.models import Company
from jobs.models import JobPost


class CompanySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='account_id', read_only=True)
    name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Company
        fields = ['id', 'name', 'logo', 'province', 'ward', 'industry', 'headcount']


class FeaturedCompanySerializer(CompanySerializer):
    """Dùng cho danh sách nổi bật/search - có kèm số liệu tổng hợp."""
    followers_count = serializers.IntegerField(read_only=True)
    active_jobs_count = serializers.IntegerField(read_only=True)
    is_promoted = serializers.BooleanField(read_only=True)

    class Meta(CompanySerializer.Meta):
        fields = CompanySerializer.Meta.fields + ['followers_count', 'active_jobs_count', 'is_promoted']


class CompanyDetailSerializer(FeaturedCompanySerializer):
    """Dùng cho trang chi tiết 1 công ty - đầy đủ nhất."""
    class Meta(FeaturedCompanySerializer.Meta):
        fields = FeaturedCompanySerializer.Meta.fields + [
            'description', 'exact_address', 'website', 'founded_date',
        ]

class CompanyDashboardSummarySerializer(serializers.Serializer):
    active_job_count = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    total_views = serializers.IntegerField()

class ApplicationStatusBreakdownItemSerializer(serializers.Serializer):
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()

class SystemOverviewSerializer(serializers.Serializer):
    total_companies = serializers.IntegerField()
    total_seekers = serializers.IntegerField()
    total_active_jobs = serializers.IntegerField()
    total_applications = serializers.IntegerField()

class JobConversionSerializer(serializers.Serializer):
    total_jobs = serializers.IntegerField()
    jobs_with_applications = serializers.IntegerField()
    jobs_without_applications = serializers.IntegerField()
    conversion_rate = serializers.FloatField()

class JobPendingReviewSerializer(serializers.ModelSerializer):
    pending_count = serializers.IntegerField()

    class Meta:
        model = JobPost
        fields = ['id', 'title', 'pending_count']