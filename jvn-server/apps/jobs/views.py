from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from .serializers import JobPostSerializer,CategorySerializer,JobPostCreateSerializer
from rest_framework import status
from .services import deny_category_service,create_category_service,approve_category_service,create_post_service,update_post_service,delete_post_service
from .selectors import get_pending_category_service,get_approved_category_service,public_read_post_service,company_read_post_service,get_post_detail_selector
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
    
class CompanyJobPostView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = JobPostCreateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job_post = create_post_service(user=request.user,data = data)
        return Response({
            'message':'Job post created successfully',
            'id': job_post.id
        },status=status.HTTP_201_CREATED)
    def get(self,request):
        my_post = company_read_post_service(user = request.user)
        serializer = JobPostSerializer(my_post, many =True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
class PublicJobPostView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        job_posts = public_read_post_service()
        serializer = JobPostSerializer(job_posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class JobPostDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, post_id):
        job_post = get_post_detail_selector(user= request.user, post_id=post_id)
        serializer = JobPostSerializer(job_post)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def patch(self, request, post_id):
        serializer = JobPostCreateSerializer(data = request.data, partial = True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job_post = update_post_service(user=request.user, post_id=post_id, data=data)
        return Response(JobPostCreateSerializer(job_post).data,status=status.HTTP_200_OK)
    
    def delete(self, request, post_id):
        job_post = delete_post_service(user=request.user, post_id= post_id)
        return Response({'message':'Delete Successfully'},status=status.HTTP_200_OK)