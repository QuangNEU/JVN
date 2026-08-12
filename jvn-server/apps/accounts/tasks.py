from celery import shared_task
from django.core.mail import EmailMessage
import logging

logger = logging.getLogger(__name__)

@shared_task(bind = True, max_retries=3, default_retry_delay = 60)
def send_verification_email_task(self, to_email, name, verify_url):
    logger.info(f"[DEV] Verify URL for {to_email}: {verify_url}")   # ← thêm dòng này
    try:
        email = EmailMessage(
            subject='Xác thực email JVN',
            body=f'Chào {name},\n\nBấm vào link sau để xác thực email: {verify_url}\n\nLink hết hạn sau 30m.',
            from_email='JVN <no-reply@jvn.com>',
            to=[to_email],
        )
        email.send(fail_silently=False)
    except Exception as exc:
        raise self.retry(exc=exc)