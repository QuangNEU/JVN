from django.urls import path
from . import views
urlpatterns = [
    path('cv/',views.CVManageView.as_view(),name='cvs')
]