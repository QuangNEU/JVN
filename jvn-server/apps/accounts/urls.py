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
    path('follow/<int:company_id>/',views.FollowView.as_view(),name='follow'),
    path('follow/', views.MyFollowView.as_view()),
    path('follow/<int:company_id>/status/', views.CheckFollowingView.as_view(), name='check-following'),
    path('email/send-verification/', views.SendEmailVerificationView.as_view(), name='send-email-verification'),
    path('email/confirm/', views.ConfirmEmailVerificationView.as_view(), name='confirm-email-verification'),
    path('business-cert/', views.BusinessCertListView.as_view(), name='business-cert-list'),  # đổi từ 'business-cert/pending/'
    path('business-cert/submit/', views.SubmitBusinessCertificationView.as_view(), name='submit-business-cert'),
    path('business-cert/<int:company_id>/approve/', views.ApproveCertView.as_view(), name='approve-business-cert'),
    path('business-cert/<int:company_id>/reject/', views.RejectBusinessCertView.as_view(), name='reject-business-cert'),
    path('<int:account_id>/lock-seeker/', views.LockSeekerView.as_view()),
    path('<int:account_id>/unlock-seeker/', views.UnlockSeekerView.as_view()),
]