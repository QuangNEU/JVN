import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

def validate_tel(value):
    if value:
        rule = re.compile(r'^(0|\+84)[35789][0-9]{8}$')
        if not rule.match(value):
            raise serializers.ValidationError("So dien thoai khong dung dinh dang")
    return value

def validate_strong_password(value):
    try:
        django_validate_password(value)
    except DjangoValidationError as e:
        raise serializers.ValidationError(list(e.messages))
    return value