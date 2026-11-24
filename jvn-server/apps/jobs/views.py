from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from .serializers import  RejectJobPostSerializer, JobPostUpdateSerializer, ExpiringJobSerializer, JobPostSerializer,CategorySerializer,JobPostCreateSerializer, SavedJobSerializer, CategoryCreateSerializer, CategoryReviewSerializer, CompanyCategorySerializer
from rest_framework import status
from core.pagnigation import StandardResultsPagination
from .models import Category
from core.permission import IsAuthenticatedAndNotLocked, have_role
from .services import reject_job_post_service, approve_job_post_service, deny_category_service,create_category_service,approve_category_service,create_post_service,update_post_service,delete_post_service, save_job_service, resubmit_category_service
from .selectors import get_admin_job_post_selector, get_expring_soon_jobs_selectors, get_admin_category_service,get_approved_category_service,public_read_post_service,company_read_post_service,get_post_detail_selector, is_saved_selector, get_saved_job_selector, get_my_category_requests_selector
# Create your views here.


class CategoryCreateView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request):
        serializer = CategoryCreateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = create_category_service(user=request.user,data = data)
        message = (
            "Tạo danh mục thành công, vui lòng chờ Admin duyệt."
            if category.status == Category.Status.PENDING
            else "Tạo danh mục thành công."
        )
        return Response({
            "message": message,
            "data": CompanyCategorySerializer(category).data
        },status=status.HTTP_201_CREATED)

class CategoryGetCompanyListView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request):
        status_query = request.query_params.get('status')
        category = get_my_category_requests_selector(user= request.user, status_filter= status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(category, request)
        serialize = CompanyCategorySerializer(page, many = True)
        return paginator.get_paginated_response(serialize.data)


class CategoryGetApprovedView(APIView):
    permission_classes=[AllowAny]
    def get(self,request):
        categories = get_approved_category_service()
        serializer = CategorySerializer(categories,many = True)
        return Response(serializer.data,status=status.HTTP_200_OK)

class CategoryGetAdminView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self,request):
        status_query = request.query_params.get('status')
        categories = get_admin_category_service(user=request.user, status_filter= status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(categories,request)
        serializer = CompanyCategorySerializer(page,many =True)
        return paginator.get_paginated_response(serializer.data)
    
class DenyCategoryView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self,request,category_id):
        data = CategoryReviewSerializer(data = request.data)
        data.is_valid(raise_exception=True)
        data = data.validated_data
        category = deny_category_service(user=request.user,category_id=category_id, reason= data.get('rejected_reason'))
        serializer = CompanyCategorySerializer(category)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
class ApproveCategoryView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self,request,category_id):
        approved_category = approve_category_service(user=request.user,category_id=category_id)
        serializer = CompanyCategorySerializer(approved_category) 
        return Response(serializer.data,status=status.HTTP_200_OK)

class ResubmitCategoryView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def patch(self, request, category_id):
        data = CategoryCreateSerializer(data = request.data)
        data.is_valid(raise_exception=True)
        data = data.validated_data
        category = resubmit_category_service(user= request.user, category_id=category_id, data=data)
        serialize = CompanyCategorySerializer(category)
        return Response(serialize.data, status=status.HTTP_200_OK)

class CompanyJobPostView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request):
        have_role(user=request.user, role='company')
        serializer = JobPostCreateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job_post = create_post_service(user=request.user,data = data)
        return Response(JobPostSerializer(job_post).data,status=status.HTTP_201_CREATED)
    def get(self,request):
        status_query = request.query_params.get('status', None)
        my_posts = company_read_post_service(user = request.user, status_filter=status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(my_posts, request)
        serializer = JobPostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
class PublicJobPostView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        category_ids_raw = request.query_params.getlist('category_ids')
        category_ids = [int(cid) for cid in category_ids_raw if cid.isdigit()]
        filters = {
            'keyword': request.query_params.get('keyword'),
            'locations': request.query_params.get('locations'),
            'salary_min': request.query_params.get('salary_min'),
            'salary_max': request.query_params.get('salary_max'),
            'level': request.query_params.get('level'),
            'type': request.query_params.get('type'),
            'category_ids': category_ids,
            'company_id': request.query_params.get('company_id'),

        }
        job_posts = public_read_post_service(filters=filters)

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(job_posts, request)
        serializer = JobPostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class JobPostDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticatedAndNotLocked()]

    def get(self, request, post_id):
        job_post = get_post_detail_selector(user= request.user, post_id=post_id)
        serializer = JobPostSerializer(job_post)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def patch(self, request, post_id):
        serializer = JobPostUpdateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job_post = update_post_service(user=request.user, post_id=post_id, data=data)
        return Response(JobPostSerializer(job_post).data,status=status.HTTP_200_OK)
    
    def delete(self, request, post_id):
        job_post = delete_post_service(user=request.user, post_id= post_id)
        return Response({'message':'Delete Successfully'},status=status.HTTP_200_OK)
    
class SaveJobView(APIView):
    permission_classes=[IsAuthenticatedAndNotLocked]
    def post(self, request, job_post_id):
        result = save_job_service(user= request.user, job_post_id=job_post_id)
        return Response(result, status= status.HTTP_200_OK)
    
class MySavedJobView(APIView):
    permission_classes= [IsAuthenticatedAndNotLocked]
    def get(self, request):
        saved_job = get_saved_job_selector(user = request.user)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(saved_job, request)
        serializer = SavedJobSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)

    
class CheckSavedJobView(APIView):
    permission_classes=[AllowAny]
    def get(self, request, job_post_id):
        is_saved = is_saved_selector(user= request.user, job_post_id= job_post_id)
        return Response({'is_saved': is_saved}, status=status.HTTP_200_OK)

class ExpiringJobsView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request):
        jobs = get_expring_soon_jobs_selectors(user=request.user)
        serializer = ExpiringJobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ApproveJobPostView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request, job_post_id):
        job_post = approve_job_post_service(user=request.user, job_post_id=job_post_id)
        return Response(JobPostSerializer(job_post).data, status=status.HTTP_200_OK)


class RejectJobPostView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request, job_post_id):
        serializer = RejectJobPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job_post = reject_job_post_service(
            user=request.user, job_post_id=job_post_id, reason=serializer.validated_data['reason']
        )
        return Response(JobPostSerializer(job_post).data, status=status.HTTP_200_OK)


class AdminJobPostReviewView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request):
        status_query = request.query_params.get('status', None)
        jobs = get_admin_job_post_selector(user=request.user, status_filter=status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(jobs, request)
        serializer = JobPostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)