# Create your views here.
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from core.pagnigation import StandardResultsPagination
from .selectors import get_featured_companies_selector, search_companies_selector, get_company_detail_selector
from .serializers import FeaturedCompanySerializer, CompanyDetailSerializer


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