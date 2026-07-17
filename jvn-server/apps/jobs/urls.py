from django.urls import path
from . import views
urlpatterns = [
    path('category/',views.ApproveCategoryView.as_view(),name= 'category-list-approved'),
    path('category/create/',views.CategoryCreateView.as_view(),name = 'category-create'),
    path('category/pending/',views.CategoryGetPendingView.as_view(),name = 'category-pending'),
    path('category/<int:category_id>/approve/',views.ApproveCategoryView.as_view(),name= 'category-approve'),
    path('category/<int:category_id>/deny',views.DenyCategoryView.as_view(),name = 'category-deny')
]