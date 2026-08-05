from celery import shared_task
from django.utils import timezone
from jobs.models import JobPost


@shared_task
def close_expired_jobs_task():
    today = timezone.localdate()
    updated_count = JobPost.objects.filter(
        status=JobPost.STATUS.PUBLISH,
        is_deleted=False,
        expiration_date__isnull=False,
        expiration_date__lt=today,
    ).update(status=JobPost.STATUS.CLOSED)

    return f'Đã tự động đóng {updated_count} tin tuyển dụng hết hạn.'