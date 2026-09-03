from rest_framework import serializers
from .models import Report

class CreateReportSerializer(serializers.Serializer):
    target_type = serializers.ChoiceField(choices=Report.TargetType.choices)
    target_id = serializers.IntegerField()
    reason = serializers.CharField(required=True, allow_blank=False, max_length=1000)


class ResolveReportSerializer(serializers.Serializer):
    admin_note = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class DismissReportSerializer(serializers.Serializer):
    admin_note = serializers.CharField(required=True, allow_blank=False, max_length=1000)  # bắt buộc, giống deny category


class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.CharField(source='reporter.email', read_only=True)
    job_post_title = serializers.CharField(source='job_post.title', read_only=True, allow_null=True)
    company_name = serializers.CharField(source='company.account.name', read_only=True, allow_null=True)
    target_account_id = serializers.SerializerMethodField()
    target_account_is_locked = serializers.SerializerMethodField()
    target_company_name = serializers.SerializerMethodField()   # thêm mới — luôn có giá trị công ty thật

    class Meta:
        model = Report
        fields = ['id', 'reporter_email', 'target_type', 'job_post', 'job_post_title',
                  'company', 'company_name', 'target_account_id', 'target_account_is_locked',
                  'target_company_name', 'reason', 'status', 'admin_note', 'created_at', 'reviewed_at']
        read_only_fields = fields

    def _get_target_account(self, obj):
        if obj.target_type == Report.TargetType.JOB_POST and obj.job_post:
            return obj.job_post.company.account
        if obj.target_type == Report.TargetType.COMPANY and obj.company:
            return obj.company.account
        return None

    def get_target_account_id(self, obj):
        account = self._get_target_account(obj)
        return account.id if account else None

    def get_target_account_is_locked(self, obj):
        account = self._get_target_account(obj)
        return account.is_locked if account else None

    def get_target_company_name(self, obj):
        account = self._get_target_account(obj)
        return account.name if account else None