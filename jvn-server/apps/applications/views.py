from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import ApplicationSerializer, ApplyJobCreateSerializer, UpdateStatusSerializer,SeekerApplicationSerializer,CompanyApplicationSerializer
from .services import apply_job_services,update_application_status
from .selectors import get_job_application_selector,get_my_applications_selector
from rest_framework import status
from core.pagnigation import StandardResultsPagination
# Create your views here.

class ApplyJobCreateView(APIView):
    permission_classes= [IsAuthenticated]
    def post(self, request, job_post_id):
        serializer = ApplyJobCreateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        apply_job = apply_job_services(user=request.user, job_post_id= job_post_id, data= data)
        return Response(ApplicationSerializer(apply_job).data,status= status.HTTP_201_CREATED)
    
class UpdateApplicationStatusView(APIView):
    permission_classes= [IsAuthenticated]
    def patch(self, request, application_id):
        serializer = UpdateStatusSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        application_updated = update_application_status(user = request.user, application_id= application_id, status_val= data.get('status') )
        return Response(CompanyApplicationSerializer(application_updated).data, status= status.HTTP_200_OK)
    
class GetMyApplicationView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        status_query = request.query_params.get('status', None)
        my_application = get_my_applications_selector(user = request.user,status_filter= status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(my_application, request)
        serializer = SeekerApplicationSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)
    
class JobApplicationView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request, post_id):
        status_query = request.query_params.get('status', None)
        job_application = get_job_application_selector(user= request.user, job_post_id= post_id, status_filter= status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(job_application, request)
        serializer = CompanyApplicationSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)