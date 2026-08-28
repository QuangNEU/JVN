from django.urls import path
from . import views
urlpatterns=[
    path('', views.CreateReportView.as_view()),
    path('admin/', views.AdminReportListView.as_view()),
    path('<int:report_id>/resolve/', views.ResolveReportView.as_view()),
    path('<int:report_id>/dismiss/', views.DismissReportView.as_view()),
]