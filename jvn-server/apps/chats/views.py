from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import GroupConversationInputSerializer, GroupConversationResponseSerializer, ConversationListItemSerializer, MessageInputSerializer, MessageSenderSerializer, MessageResponseSerializer, DirectConversationInputSerializer, DirectConversationResponseSerializer
from .services import get_or_create_direct_conversation_service, send_message_service, create_group_conversation_service, create_ws_ticket_service
from .selectors import get_conversation_messages_selector, get_my_conversations_selector
from core.permission import IsAuthenticatedAndNotLocked
from core.pagnigation import StandardResultsPagination
from django.utils.dateparse import parse_datetime

# Create your views here.
class CreateOrGetDirectConversationView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request):
        serializer = DirectConversationInputSerializer(data = request.data)
        serializer.is_valid(raise_exception= True)
        data= serializer.validated_data
        conversation = get_or_create_direct_conversation_service(user= request.user, **data)
        return Response(DirectConversationResponseSerializer(conversation).data,
            status= status.HTTP_200_OK)
    
class CreateGroupConversationView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request):
        serializer = GroupConversationInputSerializer(data = request.data)
        serializer.is_valid(raise_exception= True)
        data = serializer.validated_data
        conversation, invalid_ids = create_group_conversation_service(user= request.user, **data)
        return Response({
            'conversation': GroupConversationResponseSerializer(conversation).data,
            'skipped_applicant_ids': list(invalid_ids),
        }, status=status.HTTP_201_CREATED)

class SendMessageView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self, request, conversation_id):
        serializer = MessageInputSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        message = send_message_service(user = request.user,conversation_id=conversation_id, **data)
        return Response(MessageResponseSerializer(message).data, status= status.HTTP_201_CREATED)
    
class GetConversationMessagesView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request, conversation_id):
        before_id = request.query_params.get('before_id')
        before_id = int(before_id) if before_id else None
        limit = request.query_params.get('limit', 20)
        limit = int(limit)
        messages = get_conversation_messages_selector(user=request.user, conversation_id=conversation_id, limit=limit, before_id=before_id)
        has_more = len(messages) > limit
        messages = messages[:limit]  

        serializer = MessageResponseSerializer(messages, many=True)
        return Response({
            'results': serializer.data,
            'has_more': has_more,
        }, status=status.HTTP_200_OK)
    
class GetConversationList(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def get(self, request):
        before_time = request.query_params.get('before_time')
        before_time = parse_datetime(before_time) if before_time else None
        before_conversation_id = request.query_params.get('before_conversation_id')
        before_conversation_id = int(before_conversation_id) if before_conversation_id else None        
        limit = request.query_params.get('limit', 20)
        limit = int(limit)
        conversations = get_my_conversations_selector(user= request.user, limit= limit, before_time= before_time, before_conversation_id= before_conversation_id)
        has_more = len(conversations) >limit
        conversations = conversations[:limit]
        serializer = ConversationListItemSerializer(conversations, many = True)

        last_item = conversations[-1] if conversations else None
        next_cursor = None
        if last_item and has_more:
            next_cursor = {
                'before_time': last_item.sort_time.isoformat(),
                'before_conversation_id': last_item.conversation_id,
            }
        return Response({
            'results': serializer.data,
            'has_more': has_more,
            'next_cursor': next_cursor,
        }, status=status.HTTP_200_OK)
    
class WsTicketView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]

    def get(self, request):
        ticket = create_ws_ticket_service(user=request.user)
        return Response({'ticket': ticket}, status=status.HTTP_200_OK)