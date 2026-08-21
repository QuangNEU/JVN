from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .selectors import get_my_notifications_selector, get_unread_notification_count_selector
from .serializers import NotificationSerializer
from .services import create_notification_service, mark_notification_read_service, mark_all_notification_read_service
from rest_framework.response import Response
from core.pagnigation import StandardResultsPagination
# Create your views here.

class NotificationListView(APIView):
    permission_classes= [IsAuthenticated]
    def get(self, request):
        notifications = get_my_notifications_selector(user= request.user)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(notifications, request)
        serializer = NotificationSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)
    
class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        count = get_unread_notification_count_selector(user= request.user)
        return Response({'unread_count': count}, status= status.HTTP_200_OK)
    
class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, notification_id):
        notification = mark_notification_read_service(user= request.user, notification_id= notification_id)
        res = NotificationSerializer(notification)
        return Response(res.data, status= status.HTTP_200_OK)
    
class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request):
        count = mark_all_notification_read_service(user= request.user)
        return Response({'message': f'Mark {count} message read'})