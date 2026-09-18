from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.group_name = f'chat_{self.user.id}'
        self.active_conversation_group = None

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def check_is_participant(self):
        from .models import ConversationParticipant
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id, account=self.user
        ).exists()
    
    

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if self.active_conversation_group:
            await self.channel_layer.group_discard(self.active_conversation_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'join_conversation':
            conversation_id = data.get('conversation_id')
            is_participant = await self.check_is_participant(conversation_id)
            if not is_participant:
                return  

            if self.active_conversation_group:
                await self.channel_layer.group_discard(self.active_conversation_group, self.channel_name)

            self.active_conversation_group = f'chat_{conversation_id}'
            await self.channel_layer.group_add(self.active_conversation_group, self.channel_name)

        elif action == 'leave_conversation':
            if self.active_conversation_group:
                await self.channel_layer.group_discard(self.active_conversation_group, self.channel_name)
                self.active_conversation_group = None

    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def conversation_updated(self, event):
        await self.send(text_data=json.dumps(event))