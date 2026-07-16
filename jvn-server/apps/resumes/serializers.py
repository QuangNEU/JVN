from rest_framework import serializers
from .models import CV,Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id','tag_name']

class CVSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many = True, read_only = True)
    class Meta:
        model = CV
        fields = ['id','title','file','level','tags','created_at']

class CVCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length = 255)
    file = serializers.FileField()
    level = serializers.ChoiceField(CV.LEVEL_CHOICES)
    tag_ids = serializers.ListField(
        child = serializers.IntegerField(),
        required = False,
        allow_empty = True
    )
