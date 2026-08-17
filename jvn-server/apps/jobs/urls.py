from django.urls import path
from . import views
urlpatterns = [
    path('category/public/',views.CategoryGetApprovedView.as_view(),name= 'category-list-approved'),
    path('category/create/',views.CategoryCreateView.as_view(),name = 'category-create'),
    path('category/',views.CategoryGetAdminView.as_view(),name = 'category-pending'),
    path('category/<int:category_id>/approve/',views.ApproveCategoryView.as_view(),name= 'category-approve'),
    path('category/<int:category_id>/deny/',views.DenyCategoryView.as_view(),name = 'category-deny'),
    path('category/<int:category_id>/resubmit/', views.ResubmitCategoryView.as_view(), name='category-resubmit'),
    path('category/my-requests/', views.CategoryGetCompanyListView.as_view(), name='category-my-requests'),
    path('jobposts/', views.CompanyJobPostView.as_view()),
    path('jobposts/public/', views.PublicJobPostView.as_view()),
    path('jobposts/<int:post_id>/', views.JobPostDetailView.as_view()),
    path('saved/<int:job_post_id>/', views.SaveJobView.as_view(), name='save-job'),
    path('saved/', views.MySavedJobView.as_view(), name='my-saved-jobs'),
    path('saved/<int:job_post_id>/status/', views.CheckSavedJobView.as_view(), name='check-saved-job'),
]