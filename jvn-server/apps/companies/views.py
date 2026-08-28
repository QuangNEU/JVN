# Create your views here.
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.pagnigation import StandardResultsPagination
from .selectors import get_my_verification_status_selector, get_jobs_pending_review_selector, get_job_conversion_selector, get_system_overview_selector, get_application_status_breakdown_selector, get_featured_companies_selector, search_companies_selector, get_company_detail_selector, get_company_dashboard_summary_selector
from .serializers import JobPendingReviewSerializer, JobConversionSerializer, SystemOverviewSerializer, ApplicationStatusBreakdownItemSerializer, FeaturedCompanySerializer, CompanyDetailSerializer, CompanyDashboardSummarySerializer
from .services import lock_company_service, unlock_company_service
from accounts.serializers import LockAccountSerializer, AccountLockStatusSerializer

class FeaturedCompaniesView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        companies = get_featured_companies_selector(limit=10)
        serializer = FeaturedCompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompanySearchView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        filters = {
            'keyword': request.query_params.get('keyword'),
            'industry': request.query_params.get('industry'),
            'province': request.query_params.get('province'),
        }
        companies = search_companies_selector(filters=filters)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(companies, request)
        serializer = FeaturedCompanySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CompanyDetailView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, company_id):
        company = get_company_detail_selector(company_id=company_id)
        if not company:
            return Response({'error': 'Không tìm thấy công ty.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyDetailSerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CompanyDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        summary = get_company_dashboard_summary_selector(user=request.user)
        serializer = CompanyDashboardSummarySerializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ApplicationStatusBreakdownView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        breakdown = get_application_status_breakdown_selector(user=request.user)
        serializer = ApplicationStatusBreakdownItemSerializer(breakdown, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class SystemOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        overview = get_system_overview_selector(user=request.user)
        serializer = SystemOverviewSerializer(overview)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class JobConversionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        funnel = get_job_conversion_selector(user=request.user)
        serializer = JobConversionSerializer(funnel)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class JobsPendingReviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        jobs = get_jobs_pending_review_selector(user=request.user)
        serializer = JobPendingReviewSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MyVerificationStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        data = get_my_verification_status_selector(user=request.user)
        return Response(data, status=status.HTTP_200_OK)
    
class LockCompanyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, account_id):
        serializer = LockAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = lock_company_service(
            admin_user=request.user, target_account_id=account_id,
            reason=serializer.validated_data['reason'],
        )
        return Response(AccountLockStatusSerializer(target).data, status=status.HTTP_200_OK)


class UnlockCompanyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, account_id):
        target = unlock_company_service(admin_user=request.user, target_account_id=account_id)
        return Response(AccountLockStatusSerializer(target).data, status=status.HTTP_200_OK)