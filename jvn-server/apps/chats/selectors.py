from .models import Conversation, ConversationParticipant, Message
from django.db.models import F, Prefetch, Q
from django.db.models.functions import Coalesce
from accounts.models import Account
from rest_framework.exceptions import PermissionDenied

def get_my_conversations_selector(*, user: Account, limit: int = 20, before_time=None, before_conversation_id: int = None):
    limit = min(limit, 100)
    
    qs = ConversationParticipant.objects.filter(
        account=user
    ).select_related(
        'conversation', 'conversation__last_message', 'conversation__last_message__sender'
    ).prefetch_related(
        Prefetch(
            'conversation__participants',
            queryset=ConversationParticipant.objects.exclude(account=user).select_related('account'),
            to_attr='other_participants'
        )
    )

    qs = qs.annotate(
        sort_time = Coalesce('conversation__last_message_at', 'conversation__created_at')
    )

    if (before_time is not None) and (before_conversation_id is not None):
        qs = qs.filter(
            Q(sort_time__lt=before_time) | 
            Q(sort_time=before_time, conversation_id__lt=before_conversation_id)
        )
    qs = qs.order_by('-sort_time', '-conversation_id')
    return list(qs[:limit+1])

def get_conversation_messages_selector(*, user: Account, conversation_id, limit: int = 20, before_id: int = None):
    limit = min(limit, 100)
    is_participant = ConversationParticipant.objects.filter(
        conversation_id = conversation_id,
        account =user
    ).exists()  

    if not is_participant:
        raise PermissionDenied({'detail': 'Bạn không có quyền xem tin nhắn trong phòng này.'})
    
    qs = Message.objects.filter(
        conversation_id = conversation_id
    ).select_related('sender')

    if before_id:
        qs = qs.filter(id__lt = before_id)

    return list(qs[:limit+1])