from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.pagnigation import StandardResultsPagination
from .throttles import LoginRateThrottle
from .serializers import AccountLockHistorySerializer, AccountAdminListSerializer, AccountLockStatusSerializer, LockAccountSerializer,LoginSerializer,LogoutSerializer,RegisterSerializer,GoogleLoginSerializer,UpdateDetailSerializer,AccountDetailSerializer,CompanyDetailSerializer,ResetPasswordSerializer,ChangePasswordSerializer,ForgotPasswordSerializer, FollowSerializer, SubmitCertSerializer, CompanyCertReviewSerializer
from .services import unlock_seeker_service, lock_seeker_service, login_service,follow_service,create_user_service,google_login_service,reset_password_service,forgot_password_service,update_my_detail_service,change_password,logout, send_email_verification_service, confirm_email_verification_service, submit_business_certificate, approve_business_certificate, reject_business_certificate
from .selectors import get_account_lock_history_selector,get_admin_account_list_selector ,get_profile_detail_selector, get_is_following, get_company_selector, get_follow_company_selector, get_business_cert_list_selector
# Create your views here.
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer =  RegisterSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        account = create_user_service(
            email = data.get('email'),
            password= data.get('password'),
            role = data.get('role'),
            name = data.get('name'),
            tel = data.get('tel'),
            province= data.get('province'),
            ward=data.get('ward'),
        )

        refresh = RefreshToken.for_user(account)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': account.role,
            'email': account.email,
            'name': account.name,
        },status=status.HTTP_201_CREATED)
    
class LoginView(APIView):
    permission_classes=[AllowAny]
    throttle_classes= [LoginRateThrottle]
    def post(self, request):
        serializer = LoginSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user = login_service(email = data.get('email'),password =data.get('password'))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Đăng nhập thành công!',
            'email': user.email,
            'role': user.role,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'name':user.name
        },status=status.HTTP_200_OK)

class ChangPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        serializer = ChangePasswordSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        change_password(account=request.user,data = serializer.validated_data)
        return Response({
            "messages":"Thay doi mat khau thanh cong"
        },status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        serializer = LogoutSerializer(data= request.data)
        serializer.is_valid(raise_exception=True)
        logout(data = serializer.validated_data)
        return Response({
            'messages':'Dang xuat thanh cong'
        },status= status.HTTP_200_OK)
    
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializers = GoogleLoginSerializer(data = request.data)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data
        login_data = google_login_service(google_token=data.get('google_token'),role = data.get('role'))
        return Response(login_data,status=status.HTTP_200_OK)
    
class ForgotPasswordView(APIView):
    permission_classes=[AllowAny]
    def post(self,request):
        serializers = ForgotPasswordSerializer(data = request.data)
        serializers.is_valid(raise_exception=True)
        email = serializers.validated_data.get('email')
        forgot_password_service(email=email)
        return Response({"message": "Vui long kiem tra email"},status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes=[AllowAny]
    def post(self,request):
        serializer = ResetPasswordSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reset_password_service(data = data)
        return Response({'message':'Da thay doi mat khau thanh cong'},status=status.HTTP_200_OK)

class MyDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        account = request.user
        serializer = AccountDetailSerializer(account)
        return Response(serializer.data,status=status.HTTP_200_OK)
    def patch(self,request):
        serializer = UpdateDetailSerializer(data= request.data,partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        account = request.user
        update_my_detail_service(account=account,data=data)
        updated_account = get_profile_detail_selector(account_id=request.user.id)
        return Response(AccountDetailSerializer(updated_account).data,status=status.HTTP_200_OK)

class FollowView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, request, company_id):
        result = follow_service(
            user=request.user,
            company_id=company_id
        )
        return Response(result,status=status.HTTP_200_OK)

class CheckFollowingView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, request, company_id):
        is_following = get_is_following(
            user= request.user,
            company_id= company_id
        )
        return Response({'is_following': is_following}, status= status.HTTP_200_OK)
    
class MyFollowView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        followed_company = get_follow_company_selector(user= request.user)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(followed_company, request)
        serializer = FollowSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)
    
class SendEmailVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        result = send_email_verification_service(user= request.user)
        return Response(result, status= status.HTTP_200_OK)
    
class ConfirmEmailVerificationView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        token = request.data.get('token')
        if not token:
            return Response({"error":"Verify token is missing"})
        result = confirm_email_verification_service(token=token)
        return Response(result, status=status.HTTP_200_OK)

class SubmitBusinessCertificationView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        serializer = SubmitCertSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = submit_business_certificate(user= request.user, document=data.get('document'))
        return Response({
            'message': 'Đã nộp giấy chứng nhận, vui lòng chờ Admin duyệt.',
            'business_cert_status': result.business_cert_status,
        }, status=status.HTTP_200_OK)
    
class BusinessCertListView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        companies = get_business_cert_list_selector(user= request.user, status_filter=status_filter)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(companies, request)
        serializer = CompanyCertReviewSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)
    
class  ApproveCertView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self, request, company_id):
        company = approve_business_certificate(user= request.user, company_id=company_id)
        return Response({
            'message': 'Đã duyệt giấy chứng nhận',
            'business_cert_status': company.business_cert_status,
        }, status=status.HTTP_200_OK)
    
class RejectBusinessCertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):
        reason = request.data.get('reason', '')
        company = reject_business_certificate(user=request.user, company_id=company_id, reason=reason)
        return Response({
            'message': 'Đã từ chối giấy chứng nhận',
            'business_cert_status': company.business_cert_status,
        }, status=status.HTTP_200_OK)
    
class LockSeekerView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, account_id):
        serializer = LockAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = lock_seeker_service(
            admin_user=request.user, target_account_id=account_id,
            reason=serializer.validated_data['reason'],
        )
        return Response(AccountLockStatusSerializer(target).data, status=status.HTTP_200_OK)


class UnlockSeekerView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, account_id):
        target = unlock_seeker_service(admin_user=request.user, target_account_id=account_id)
        return Response(AccountLockStatusSerializer(target).data, status=status.HTTP_200_OK)
    
class AdminAccountListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        role_query = request.query_params.get('role', None)
        locked_query = request.query_params.get('is_locked', None)
        is_locked_filter = None
        if locked_query is not None:
            is_locked_filter = locked_query.lower() == 'true'

        accounts = get_admin_account_list_selector(
            user=request.user, role_filter=role_query, is_locked_filter=is_locked_filter,
        )
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(accounts, request)
        serializer = AccountAdminListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AccountLockHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, account_id):
        history = get_account_lock_history_selector(user=request.user, account_id=account_id)
        serializer = AccountLockHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)