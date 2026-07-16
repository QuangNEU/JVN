from django.urls import path
from . import views
urlpatterns = [
    path('cv/',views.CVManageView.as_view(),name='cvs'),
    path('cv/<int:cv_id>/',views.CVDetailView.as_view(),name='cv-detail'),
    path('cv/<int:cv_id>/set-default/',views.CVSetDefaultView.as_view(),name = 'set-default'),
]