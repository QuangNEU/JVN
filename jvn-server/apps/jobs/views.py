from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from .serializers import JobPostSerializer,CategorySerializer
from rest_framework import status
from .services import deny_category_service,create_category_service,approve_category_service
from .selectors import get_pending_category_service,get_approved_category_service
# Create your views here.


class CategoryCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = CategorySerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = create_category_service(user=request.user,data = data)
        return Response({
            "message": "Tạo danh mục thành công, vui lòng chờ Admin duyệt.",
            "data": CategorySerializer(category).data
        },status=status.HTTP_201_CREATED)
    
class CategoryGetApprovedView(APIView):
    permission_classes=[AllowAny]
    def get(self,request):
        categories = get_approved_category_service()
        serializer = CategorySerializer(categories,many = True)
        return Response(serializer.data,status=status.HTTP_200_OK)

class CategoryGetPendingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        categories = get_pending_category_service()
        serializer = CategorySerializer(categories,many =True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
class DenyCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request,category_id):
        message = deny_category_service(user=request.user,category_id=category_id)
        return Response(message,status=status.HTTP_200_OK)
    
class ApproveCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request,category_id):
        message = approve_category_service(user=request.user,category_id=category_id)
        return Response(message,status=status.HTTP_200_OK)