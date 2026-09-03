from .serializers import ReportSerializer, CreateReportSerializer, DismissReportSerializer, ResolveReportSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import Http404
from core.permission import IsAuthenticatedAndNotLocked
from core.pagnigation import StandardResultsPagination
from rest_framework import status
from .services import create_report_services, dismiss_report_service, resolve_report_service
from .selectors import get_admin_report_selector

class CreateReportView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request):
        serializer = CreateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = create_report_services(user=request.user, **serializer.validated_data)
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


class AdminReportListView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request):
        status_query = request.query_params.get('status', None)
        reports = get_admin_report_selector(status_filter=status_query)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(reports, request)
        serializer = ReportSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ResolveReportView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request, report_id):
        try:
            serializer = ResolveReportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            report = resolve_report_service(
                admin_user=request.user, report_id=report_id,
                admin_note=serializer.validated_data.get('admin_note')
            )
            return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
        except Http404:
            return Response(
                {'detail': 'Báo cáo này đã được admin khác xử lý.'},
                status=status.HTTP_409_CONFLICT
            )


class DismissReportView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request, report_id):
        try: 
            serializer = DismissReportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            report = dismiss_report_service(
                admin_user=request.user, report_id=report_id,
                admin_note=serializer.validated_data['admin_note']
            )
            return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
        except Http404:
            return Response(
                {'detail': 'Báo cáo này đã được admin khác xử lý.'},
                status=status.HTTP_409_CONFLICT
            )