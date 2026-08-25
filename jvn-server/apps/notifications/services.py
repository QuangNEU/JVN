from django.db import transaction
from accounts.models import Account
from .models import Notification
from django.shortcuts import get_object_or_404
from .tasks import send_notification_email_task, send_massive_notification_task

def create_notification_service(*, user: Account, message: str, link: str, is_read: bool = False, send_email: bool = False):
    notification = Notification.objects.create(
        recipient = user,
        message = message, 
        link = link,
        is_read = is_read,
    )
    if send_email:
        transaction.on_commit(lambda: send_notification_email_task.delay(notification.id))
    return notification

def create_bulk_notification_service(*, filter_kwargs: dict, message: str, link: str, is_read: bool = False, send_email: bool = False):
    transaction.on_commit(
        lambda: send_massive_notification_task.delay(filter_kwargs = filter_kwargs, message = message, link = link, is_read = is_read)
    )

def mark_notification_read_service(*, user:Account, notification_id):
    notification = get_object_or_404(Notification, pk = notification_id, recipient = user)
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return notification

def mark_all_notification_read_service(*, user:Account):
    count = Notification.objects.filter(recipient = user, is_read = False).update(is_read = True)
    return count

