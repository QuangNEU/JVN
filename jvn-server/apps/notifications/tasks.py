import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

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