from rest_framework import serializers
from .models import Category,JobPost, SavedJob
from resumes.serializers import TagSerializer
from resumes.models import CV

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id','title','children']

    def get_children(self,obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.all(),many=True).data
        return[]

class JobPostSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(read_only=True) 
    company_name = serializers.CharField(source='company.account.name', read_only=True)
    company_province = serializers.CharField(source='company.province', read_only=True)
    company_ward = serializers.CharField(source='company.ward', read_only=True)
    company_exact_address = serializers.CharField(source='company.exact_address', read_only=True, allow_null=True)
    company_logo = serializers.SerializerMethodField()
    company_headcount = serializers.CharField(source='company.headcount', read_only=True, allow_null=True)
    company_industry = serializers.CharField(source='company.industry', read_only=True, allow_null=True)
    # company_website = serializers.CharField(source='company.website', read_only=True, allow_null=True)

    tags = TagSerializer(many=True,read_only = True)
    category = CategorySerializer(many = True,read_only = True)

    def get_company_logo(self, obj):
        if obj.company.logo:
            return obj.company.logo.url
        return None
    
    class Meta:
        model=JobPost
        fields =[ 'id', 'title', 'descriptions', 'requirement', 'benefit',
            'company_name', 'company_province', 'company_ward', 'company_exact_address',
            'company_logo', 'company_headcount', 'company_industry',
            'level', 'type', 'status', 'experience_requirement', 'headcount',
            'salary_min', 'salary_max', 'currency', 'is_negotiable',
            'date_posted', 'expiration_date', 'category', 'tags', 'company_id']
        
class JobPostCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    descriptions = serializers.CharField()
    requirement = serializers.CharField()
    benefit = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=JobPost.TYPE)
    level = serializers.ChoiceField(choices=CV.LEVEL_CHOICES)
    experience_requirement = serializers.CharField(max_length=50)
    headcount = serializers.IntegerField(min_value=1)
    salary_min = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    currency = serializers.CharField(max_length=10, required=False)
    is_negotiable = serializers.BooleanField(required=False)
    expiration_date = serializers.DateField(required = False, allow_null = True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    def validate(self, data):
        if (data.get('salary_min') and data.get('salary_max') and data.get('salary_min') > data.get('salary_max')):
            raise serializers.ValidationError({'error':'min salary can not be smaller than max salary'})
        return data
    
class SavedJobSerializer(serializers.ModelSerializer):
    job_post = JobPostSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job_post', 'created_at']
        read_only_fields = ['id', 'created_at']