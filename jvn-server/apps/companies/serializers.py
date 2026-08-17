from rest_framework import serializers
from accounts.models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Bản gọn - dùng cho card/list thông thường (không có điểm số)."""
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