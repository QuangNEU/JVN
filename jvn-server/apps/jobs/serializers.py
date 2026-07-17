from rest_framework import serializers
from .models import Category,JobPost
from resumes.serializers import TagSerializer


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        field = ['id','title','children']

    def get_children(self,obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.all(),many=True).data
        return[]

class JobPostSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.account.name',read_only = True)
    tags = TagSerializer(many=True,read_only = True)
    category = CategorySerializer(many = True,read_only = True)
    class Meta:
        model=JobPost
        field =['id', 'title', 'company_name', 'level', 'type', 
            'salary_min', 'salary_max', 'currency', 'is_negotiable',
            'location', 'date_posted', 'category', 'tags']