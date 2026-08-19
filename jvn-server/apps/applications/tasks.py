import logging
from celery import shared_task
from .models import Application


logger = logging.getLogger(__name__)


@shared_task(bind= True, max_retries = 3, default_retry_delay=60)
def send_application_status_email_task(self, application_id):
    from .email import send_application_status_email

    try:
        application = Application.objects.select_related(
            'applicant__account',
            'job_post__company__account',
        ).get(pk= application_id)
    except Application.DoesNotExist:
        logger.warning(f'[send_application_status_email_task] Application {application_id} không tồn tại (có thể đã bị xóa) - bỏ qua.')
        return
    
    try:
        send_application_status_email(application)
    except Exception as exc:
        logger.exception(f'[send_application_status_email_task] Gửi email thất bại, application_id={application_id}, thử lại lần {self.request.retries + 1}/{self.max_retries}')
        raise self.retry(exc=exc, countdown=60)