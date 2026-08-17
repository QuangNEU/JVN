from django.urls import path
from . import views

urlpatterns = [
    path('featured/', views.FeaturedCompaniesView.as_view()),
    path('search/', views.CompanySearchView.as_view()),
    path('<int:company_id>/', views.CompanyDetailView.as_view()),
]