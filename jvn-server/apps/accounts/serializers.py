from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError
from core.validator import validate_strong_password,validate_tel
from .models import Account, JobSeeker, Company, Follow
from core.constants import HEADCOUNT_CHOICES

PUBLIC_ROLE_CHOICES = (
        ("SEEKER", "Nguoi tim viec"),
        ("COMPANY", "Nha tuyen dung"),
)
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only = True,min_length = 6,validators =[validate_strong_password])
    role = serializers.ChoiceField(choices=PUBLIC_ROLE_CHOICES)
    name = serializers.CharField(max_length = 255)
    province = serializers.CharField(max_length = 100,required = False, allow_blank = True)
    ward = serializers.CharField(max_length = 255,required = False,allow_blank = True)
    tel = serializers.CharField(max_length =15,required = False, allow_blank = True,validators = [validate_tel])
    def validate_email(self, value):
        if Account.objects.filter(email = value).exists():
            raise serializers.ValidationError("Email nay da ton tai")
        return value
    
    def validate(self, data):
        role = data.get("role")
        province = data.get('province')
        ward = data.get('ward')
        tel = data.get('tel')
        if role == "COMPANY" and (not province or not ward or not tel):
            raise serializers.ValidationError("Vui long dien day du thong tin")
        return data
    

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only = True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required = True,write_only = True)
    new_password = serializers.CharField(
        required = True,
        write_only = True,
        validators = [validate_strong_password]
    )
    confirm_new_password = serializers.CharField(required = True,write_only = True)

    def validate(self, data):
        if data.get('new_password') == data.get('old_password'):
            raise serializers.ValidationError('Vui long nhap mat khau khac mat khau cu')
        elif data.get('new_password') != data.get('confirm_new_password'):
            raise serializers.ValidationError("Mat khau xac nhan khon chinh xac. Vui long kiem tra lai")
        return data

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required= True)

class GoogleLoginSerializer(serializers.Serializer):
    google_token = serializers.CharField(required = True) 
    role = serializers.ChoiceField(
        choices=PUBLIC_ROLE_CHOICES,
        required = False,
        allow_null = True
    )   

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required = True)

class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField(required = True)
    token = serializers.CharField(required = True)
    new_password = serializers.CharField(required = True,validators = [validate_strong_password])
    confirm_new_password = serializers.CharField(required = True)
    def validate(self, data):
        if data.get('new_password') != data.get('confirm_new_password'):
            raise serializers.ValidationError({"confirm_new_password":'Mat khau khong khop vui long nhap lai'})
        return data


class SeekerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSeeker
        fields = ['github_urls']

class CompanyDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='account.name', read_only=True)
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'name', 'description', 'headcount', 'province', 'ward', 'exact_address',
            'logo', 'website', 'founded_date', 'tax_code', 'industry', 'followers_count',
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()
    
class CompanySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='account_id', read_only=True)
    name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Company
        fields = ['id', 'name', 'logo', 'province', 'ward', 'industry', 'headcount']
    
class AccountDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    class Meta:
        model = Account
        fields = ['id','email','name','tel','profile']

    def get_profile(self,obj):
        if obj.role == 'SEEKER':
            return SeekerDetailSerializer(obj.jobseeker).data
        elif obj.role == 'COMPANY':
            return CompanyDetailSerializer(obj.company).data
        else:
            return None


class UpdateDetailSerializer(serializers.Serializer):
    tel = serializers.CharField(max_length=15, required=False, allow_blank=True, validators=[validate_tel])
    name = serializers.CharField(max_length=255, required=False)
    
    # Cho Seeker
    github_urls = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Cho Company
    logo = serializers.ImageField(required=False, allow_null=True)
    province = serializers.CharField(max_length=100, required=False, allow_blank=True)
    ward = serializers.CharField(max_length=255, required=False, allow_blank=True)
    exact_address = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    headcount = serializers.ChoiceField(choices=HEADCOUNT_CHOICES, required=False)   
    website = serializers.URLField(required=False, allow_blank=True)
    founded_date = serializers.DateField(required=False, allow_null=True)
    tax_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    industry = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
class FollowSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'company', 'created_at']
        read_only_fields = ['id', 'created_at']

class CompanyCertReviewSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source = 'account_id', read_only = True)
    company_name = serializers.CharField(source= 'account.name', read_only = True)
    document_url = serializers.SerializerMethodField()
    class Meta:
        model = Company
        fields = ['id', 'company_name', 'tax_code', 'document_url', 'business_cert_status', 'business_cert_reviewed_at', 'business_cert_rejected_reason']
        read_only_fields = ['tax_code', 'business_cert_reviewed_at']

    def get_document_url(self, obj):
        return obj.business_cert_document.url if obj.business_cert_document else None
    
class SubmitCertSerializer(serializers.Serializer):
    document = serializers.FileField()

