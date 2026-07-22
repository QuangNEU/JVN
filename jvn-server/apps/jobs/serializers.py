from rest_framework import serializers
from .models import Category,JobPost
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
    company_name = serializers.CharField(source='company.account.name',read_only = True)
    tags = TagSerializer(many=True,read_only = True)
    categories = CategorySerializer(many = True,read_only = True)
    class Meta:
        model=JobPost
        fields =['id', 'title', 'company_name', 'level', 'type', 
            'salary_min', 'salary_max', 'currency', 'is_negotiable'
            , 'date_posted', 'category', 'tags']
        
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
    expiration_date = serializers.DateTimeField()
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    def validate(self, data):
        if (data.get('salary_min') and data.get('salary_max') and data.get('salary_min') > data.get('salary_max')):
            raise serializers.ValidationError({'error':'min salary can not be smaller than max salary'})
        return data