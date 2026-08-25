import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import Account
from .models import Notification

logger = logging.getLogger(__name__)

@shared_task(bind = True, max_retries = 3)
def send_notification_email_task(self, notification_id):
    from .models import Notification
    try:
        notification = Notification.objects.select_related('recipient').get(id=notification_id)
    except Notification.DoesNotExist:
        return
    
    try:
        send_mail(
            subject='Thông báo mới từ JVN',
            message=notification.message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.recipient.email],
        )
    except Exception as exc:
        logger.exception('Gửi email thông báo thất bại, notification_id=%s', notification_id)
        raise self.retry(exc=exc, countdown=60)
    
@shared_task(bind = True, max_retries = 3)
def send_massive_notification_task(self, filter_kwargs: dict, message, link, is_read):
    BATCH_SIZE = 1000

    user_qs = Account.objects.filter(**filter_kwargs)

    notifications =[]
    for user in user_qs.iterator(chunk_size= BATCH_SIZE):
        notifications.append(
            Notification(recipient=user, message=message, link=link, is_read = is_read) # Luu vao RAM chu chua luu vao db
        )

        if len(notifications) >= 1000:
            Notification.objects.bulk_create(notifications)
            notifications = []
    
    if notifications:
        Notification.objects.bulk_create(notifications)
