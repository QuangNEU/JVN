from django.db import models
from accounts.models import Account

# Create your models here.
class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = 'DIRECT'
        GROUP = 'GROUP'

    type = models.CharField(max_length=20, choices= Type.choices)
    title = models.CharField(max_length=255, null= True, blank= True)
    created_by = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null= True, blank= True)
    last_message = models.ForeignKey('Message', null=True,blank=True, on_delete=models.SET_NULL, related_name='+')
    job_post = models.ForeignKey('jobs.JobPost', null=True, blank=True, on_delete=models.SET_NULL)
    application = models.ForeignKey('applications.Application', null=True, blank=True, on_delete=models.SET_NULL)
    direct_hash = models.CharField(max_length=100, unique=True, null=True, blank=True)

class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)  
    is_muted = models.BooleanField(default=False)
    class Meta:
        unique_together = ('conversation', 'account')

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='+')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['conversation', '-created_at'])]
        ordering = ['-created_at']