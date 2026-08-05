from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
urlpatterns = [
    path("register/",views.RegisterView.as_view()),
    path('login/',views.LoginView.as_view()),
    path('profile/',views.MyDetailView.as_view()),
    path('password/change/',views.ChangPasswordView.as_view()),
    path('logout/',views.LogoutView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google-login/',views.GoogleLoginView.as_view()),
    path('password/forgot/',views.ForgotPasswordView.as_view()),
    path('password/reset/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('follow/<int:company_id>/',views.FollowView.as_view,name='follow'),
    path('follow/<int:company_id>/status/', views.CheckFollowingView.as_view(), name='check-following'),
]