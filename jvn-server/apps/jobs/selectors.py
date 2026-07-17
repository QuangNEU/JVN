from .models import Category

def get_approved_category_service():
    categories = Category.objects.filter(status = Category.Status.APPROVED).select_related('parent')
    return categories 

def get_pending_category_service():
    categories = Category.objects.filter(status = Category.Status.PENDING).select_related('parent')
    return categories