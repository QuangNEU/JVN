from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import SeekerDetailSerializer,LoginSerializer,LogoutSerializer,RegisterSerializer,GoogleLoginSerializer,UpdateDetailSerializer,AccountDetailSerializer,CompanyDetailSerializer,ResetPasswordSerializer,ChangePasswordSerializer,ForgotPasswordSerializer
from .services import login_service,follow_service,create_user_service,google_login_service,reset_password_service,forgot_password_service,update_my_detail_service,change_password
from .selectors import get_profile_detail_selector

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
        },status=status.HTTP_201_CREATED)
    
class LoginView(APIView):
    permission_classes=[AllowAny]
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
        change_password(data = serializer.validated_data)
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
        reset_password_service(data)
        return Response({'message':'Da thay doi mat khau thanh cong'},status=status.HTTP_200_OK)

class MyDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        account = request.user
        serializer = AccountDetailSerializer(account)
        return Response(serializer.data,status=status.HTTP_200_OK)
    def patch(self,request):
        serializers = UpdateDetailSerializer(data= request.data,partial=True)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data
        account = request.user
        update_my_detail_service(account=account,data=data)
        updated_account = get_profile_detail_selector(account_id=request.user.id)
        return Response(AccountDetailSerializer(updated_account).data,status=status.HTTP_200_OK)

class FollowView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,company_id):
        result = follow_service(
            user=request.user,
            company_id=company_id
        )
        return Response(result,status=status.HTTP_200_OK)
