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

    class Meta:
        model = Report
        fields = ['id', 'reporter_email', 'target_type', 'job_post', 'job_post_title',
                  'company', 'company_name', 'reason', 'status', 'admin_note',
                  'created_at', 'reviewed_at']
        read_only_fields = fields