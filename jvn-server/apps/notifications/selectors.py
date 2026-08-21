from accounts.models import Account
from .models import Notification

def get_my_notifications_selector(*, user: Account):
    return Notification.objects.filter(recipient = user)

def get_unread_notification_count_selector(*, user: Account):
    return Notification.objects.filter(recipient = user, is_read = False).count()