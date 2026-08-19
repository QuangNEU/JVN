from rest_framework import serializers
from resumes.serializers import CVSerializer
from jobs.serializers import JobPostSerializer
from .models import Application

class ApplyJobCreateSerializer(serializers.Serializer):
    cv_id = serializers.IntegerField()
    cover_letter = serializers.CharField(required = False, allow_blank = True)

class ApplicationSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    job_post = JobPostSerializer(read_only=True)
    applicant_name = serializers.CharField(source='applicant.account.name', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'applicant_name', 'cv', 'job_post', 'cover_letter', 'status', 'date_applied', 'interview_date', 'rejected_reason']

class UpdateStatusSerializer(serializers.Serializer):
    status = serializers.CharField(max_length = 20)
    interview_date = serializers.DateTimeField(required = False, allow_null = True)
    rejected_reason = serializers.CharField(required = False, allow_null = True)
    def validate(self, attrs):
        if attrs.get('status') == Application.Status.INTERVIEWING and not attrs.get('interview_date'):
            raise serializers.ValidationError(
                {'interview_date': 'Bắt buộc nhập thời gian phỏng vấn khi chuyển trạng thái Phỏng vấn.'}
            )
        return attrs

class SeekerApplicationSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    job_post = JobPostSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = ['id', 'cv', 'job_post', 'cover_letter', 'status', 'date_applied', 'interview_date', 'rejected_reason']

class CompanyApplicationSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    applicant_name = serializers.CharField(source='applicant.account.name', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'applicant_name', 'cv', 'cover_letter', 'status', 'date_applied', 'interview_date', 'rejected_reason']

class BulkCheckAppliedSerializer(serializers.Serializer):
    applied_job_ids = serializers.ListField(child=serializers.IntegerField())
