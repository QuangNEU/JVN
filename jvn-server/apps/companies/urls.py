from django.urls import path
from . import views

urlpatterns = [
    path('featured/', views.FeaturedCompaniesView.as_view()),
    path('search/', views.CompanySearchView.as_view()),
    path('<int:company_id>/', views.CompanyDetailView.as_view()),
    path('dashboard-summary/', views.CompanyDashboardSummaryView.as_view(), name='company-dashboard-summary'),
    path('application-status-breakdown/', views.ApplicationStatusBreakdownView.as_view(), name='company-application-breakdown'),
    path('system-overview/', views.SystemOverviewView.as_view(), name='system-overview'),
    path('job-conversion/', views.JobConversionView.as_view(), name='job-conversion'),
    path('jobs-pending-review/', views.JobsPendingReviewView.as_view(), name='jobs-pending-review'),
    path('me/verification-status/', views.MyVerificationStatusView.as_view(), name='my-verification-status'),
    path('<int:account_id>/lock-company/', views.LockCompanyView.as_view(),),
    path('<int:account_id>/unlock-company/',views.UnlockCompanyView.as_view())
]