from rest_framework import serializers
from accounts.models import Account
from .models import Conversation, Message, ConversationParticipant
import logging
from core.validator import validate_html_tag

logger = logging.getLogger(__name__)


class DirectConversationInputSerializer(serializers.Serializer):
    other_account_id = serializers.IntegerField(write_only=True)
    job_post_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    application_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

class GroupConversationInputSerializer(serializers.Serializer):
    job_post_id = serializers.IntegerField(write_only=True)
    title = serializers.CharField(max_length=255, write_only=True)
    applicant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        write_only=True,
    )

class ParticipantSerializer(serializers.ModelSerializer):
    account_id = serializers.IntegerField(source='account.id', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ['account_id', 'account_name']


class GroupConversationResponseSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'type', 'job_post', 'created_at', 'participants']

class MessageSenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name']


class MessageResponseSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'sender']

class MessageInputSerializer(serializers.Serializer):
    content = serializers.CharField(max_length = 2000, allow_blank = False, required = True, validators = [validate_html_tag])

class DirectConversationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'type', 'title', 'job_post', 'application', 'created_at']

class ConversationListItemSerializer(serializers.ModelSerializer):
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    type = serializers.CharField(source='conversation.type', read_only=True)
    display_name = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    last_message_at = serializers.DateTimeField(source='conversation.last_message_at', read_only=True)
    is_unread = serializers.SerializerMethodField()

    class Meta:
        model = ConversationParticipant
        fields = [
            'conversation_id', 'type', 'display_name',
            'last_message_preview', 'last_message_at', 'is_unread',
        ]

    def get_is_unread(self, obj):
        last_message_at = obj.conversation.last_message_at
        if last_message_at is None:
            return False
        if obj.last_read_at is None:
            return True
        return last_message_at > obj.last_read_at

    def get_display_name(self, obj):
        if obj.conversation.type == Conversation.Type.DIRECT:
            other_participants = obj.conversation.other_participants
            if not other_participants:
                logger.error(
                    "DIRECT conversation %s has no other participant for user %s — data integrity issue.",
                    obj.conversation.id, obj.account_id
                )
                return "Người dùng không xác định"
            return other_participants[0].account.name
        return obj.conversation.title

    def get_last_message_preview(self, obj):
        last_message = obj.conversation.last_message
        if last_message is None:
            return None
        return last_message.content[:50]