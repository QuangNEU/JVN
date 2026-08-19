from django.urls import path
from . import views

urlpatterns = [
    path('apply/<int:job_post_id>/',views.ApplyJobCreateView.as_view(),name='apply_job'),
    path('me/application/',views.GetMyApplicationView.as_view(),name= 'my_application'),
    path('job/<int:post_id>/',views.JobApplicationView.as_view(),name= 'job_application'),
    path('update_status/<int:application_id>',views.UpdateApplicationStatusView.as_view(),name= 'update_status'),
    path('check-applied/bulk/', views.BulkCheckAppliedView.as_view(), name='check-applied-bulk'),
    path('check-applied/<int:job_post_id>/', views.CheckAppliedView.as_view(), name='check-applied'),
]