import hashlib
from django.db import transaction, IntegrityError
from django.db.models import Q
from accounts.models import Account
from jobs.models import JobPost
from applications.models import Application
from .models import Conversation, ConversationParticipant, Message
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import secrets
from django.core.cache import cache
from accounts.models import Account

def generate_direct_hash(user_id_1: int, user_id_2:int):
    sort_ids = sorted([user_id_1,user_id_2])
    raw = f'{sort_ids[0]}_{sort_ids[1]}'
    return hashlib.sha256(raw.encode()).hexdigest()

@transaction.atomic
def get_or_create_direct_conversation_service(*, user: Account, other_account_id, job_post_id = None, application_id = None):
    try:
        direct_hash = generate_direct_hash(user_id_1=user.id, user_id_2=other_account_id)
        conversation, created = Conversation.objects.get_or_create(
            direct_hash = direct_hash,
            defaults={
                'type': Conversation.Type.DIRECT,
                'created_by': user,
                'job_post_id': job_post_id,
                'application_id': application_id,
            }
        )
        if created:
            ConversationParticipant.objects.bulk_create([
            ConversationParticipant(conversation=conversation, account=user),
            ConversationParticipant(conversation=conversation, account_id=other_account_id),
        ])
    except IntegrityError:
        raise ValidationError({
            'detail': 'Người dùng, Công việc hoặc Hồ sơ không tồn tại. Vui lòng kiểm tra lại.'
        })
    return conversation

@transaction.atomic
def create_group_conversation_service(*, user: Account, job_post_id = None, title, applicant_ids:list[int]):
    if user.role != Account.ROLE_CHOICES.COMPANY:
        raise PermissionDenied({'detail': 'You dont have the permission to create group chat'})
    
    job_post = get_object_or_404(JobPost, pk = job_post_id, company = user.company)

    valid_seeker_ids = list(Application.objects.filter(
        job_post = job_post,
        applicant_id__in = applicant_ids
    ).values_list('applicant_id', flat= True).distinct())

    if not valid_seeker_ids:
        raise ValidationError({'detail': 'Không có ứng viên nào hợp lệ để thêm vào nhóm.'})

    conversation = Conversation.objects.create(
        title = title,
        type = Conversation.Type.GROUP,
        created_by = user,
        job_post = job_post
    )

    participant = [ConversationParticipant(conversation = conversation, account = user)]
    participant += [ConversationParticipant(conversation = conversation, account_id = id) for id in valid_seeker_ids]

    ConversationParticipant.objects.bulk_create(participant, batch_size=500)
    input_ids = set(applicant_ids)
    valid_ids = set(valid_seeker_ids)
    invalid_ids = input_ids - valid_ids
    return conversation, invalid_ids

@transaction.atomic
def send_message_service(*, user: Account, conversation_id, content):
    participant = get_object_or_404(ConversationParticipant.objects.select_related('conversation'), conversation_id = conversation_id, account = user )
    conversation = participant.conversation
    message = Message.objects.create(
            conversation = conversation,
            sender = user,
            content = content
    )
    conversation.last_message_at = message.created_at
    conversation.last_message = message
    conversation.save(update_fields=['last_message_at', 'last_message'])

    participant.last_read_at = message.created_at
    participant.save(update_fields=['last_read_at'])
    participant_ids = list(
    ConversationParticipant.objects.filter(conversation_id=conversation_id)
        .values_list('account_id', flat=True)
    )
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
    f'chat_{conversation_id}',
    {
        'type': 'chat_message',
        'conversation_id': conversation_id,
        'message_id': message.id,
        'sender_id': user.id,
        'content': message.content,
        'created_at': message.created_at.isoformat(),
    })

    for account_id in participant_ids:
        async_to_sync(channel_layer.group_send)(
            f'user_{account_id}',
            {
                'type': 'conversation_updated',
                'conversation_id': conversation_id,
                'last_message_preview': message.content[:50],
                'last_message_at': message.created_at.isoformat(),
            }
        )
    return message

def create_ws_ticket_service(*, user: Account):
    ticket = secrets.token_urlsafe(32)
    cache.set(f'ws_ticket:{ticket}', user.id, timeout=10)
    return ticket