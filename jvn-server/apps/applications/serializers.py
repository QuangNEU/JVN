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
        fields = ['id', 'applicant_name', 'cv', 'job_post', 'cover_letter', 'status', 'date_applied']

class UpdateStatusSerializer(serializers.Serializer):
    status = serializers.CharField(max_length = 20)

class SeekerApplicationSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    job_post = JobPostSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = ['id', 'cv', 'job_post', 'cover_letter', 'status', 'date_applied']

class CompanyApplicationSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    applicant_name = serializers.CharField(source='applicant.account.name', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'applicant_name', 'cv', 'cover_letter', 'status', 'date_applied']