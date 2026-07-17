from django.db import transaction
from accounts.models import Account
from core.permission import get_owned_or_403,have_role
from .models import Category
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

@transaction.atomic
def create_category_service(*, user:Account, data:dict):
    have_role(user=user,role ='company')
    parent = None
    if data.get('parent_id'):
        parent = get_object_or_404(Category, id=data.parent_id)
    category=Category.objects.create(
        title=data.get('title'),
        status=Category.Status.PENDING,
        created_by = user,
        parent = parent
    )
    return category


def deny_category_service(*,user:Account,category_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,pk = category_id)
    category.status = Category.Status.REJECTED
    category.save(update_fields=['status'])
    return {
        'message':'Tu choi thanh cong'
    }

def approve_category_service(*,user: Account,catergory_id:int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail':'You dont have the permission'})
    category = get_object_or_404(Category,ok=catergory_id)
    category.status = Category.Status.APPROVED
    category.save(update_fields=['status'])
    return{
        'message':'Da dong y'
    }