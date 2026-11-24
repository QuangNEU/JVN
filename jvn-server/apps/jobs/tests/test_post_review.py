from datetime import timedelta
from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from jobs.models import JobPost
from jobs.tasks import close_expired_jobs_task
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_job,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class JobPostReviewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('celery.app.task.Task.delay')
    def test_reject_requires_reason(self, mock_delay):
        """C1: Từ chối tin bắt buộc phải có lý do (reason). Nếu để trống, trả về lỗi 400 và status giữ nguyên."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        job = make_job(company=company, status="PENDING")

        self.client.force_authenticate(user=admin)
        url = f'/api/jobs/job-post/{job.id}/reject/'

        # 1. Từ chối không gửi reason -> Lỗi 400
        response_empty = self.client.post(url, {}, format='json')
        self.assertEqual(response_empty.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_empty.data.get('field'), 'reason')

        job.refresh_from_db()
        self.assertEqual(job.status, JobPost.STATUS.PENDING)
        self.assertFalse(bool(job.rejected_reason))

        # 2. Từ chối với reason rỗng -> Lỗi 400
        response_blank = self.client.post(url, {'reason': ''}, format='json')
        self.assertEqual(response_blank.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_blank.data.get('field'), 'reason')

        job.refresh_from_db()
        self.assertEqual(job.status, JobPost.STATUS.PENDING)

        # 3. Từ chối có reason hợp lệ -> Thành công 200, status thành REJECTED
        valid_reason = 'Mô tả công việc không rõ ràng, yêu cầu bổ sung.'
        response_valid = self.client.post(url, {'reason': valid_reason}, format='json')
        self.assertEqual(response_valid.status_code, status.HTTP_200_OK)

        job.refresh_from_db()
        self.assertEqual(job.status, JobPost.STATUS.REJECTED)
        self.assertEqual(job.rejected_reason, valid_reason)

    @patch('celery.app.task.Task.delay')
    def test_close_expired_only_closes_published(self, mock_delay):
        """C2: Task đóng tin hết hạn chỉ chuyển status các tin PUBLISHED thành CLOSED."""
        company = make_company(verification_level=2)
        yesterday = timezone.localdate() - timedelta(days=1)
        tomorrow = timezone.localdate() + timedelta(days=1)

        # Tạo 4 loại tin tuyển dụng
        job_published_expired = make_job(company=company, status="PUBLISHED", expiration_date=yesterday)
        job_published_active = make_job(company=company, status="PUBLISHED", expiration_date=tomorrow)
        job_pending_expired = make_job(company=company, status="PENDING", expiration_date=yesterday)
        job_rejected_expired = make_job(company=company, status="REJECTED", expiration_date=yesterday)

        # Chạy task đóng tin hết hạn
        result_message = close_expired_jobs_task()
        self.assertIn('Đã tự động đóng', result_message)

        # Assert trạng thái sau khi chạy task:
        # 1. Tin PUBLISHED đã hết hạn -> CLOSED
        job_published_expired.refresh_from_db()
        self.assertEqual(job_published_expired.status, JobPost.STATUS.CLOSED)

        # 2. Tin PUBLISHED còn hạn -> Giữ nguyên PUBLISHED
        job_published_active.refresh_from_db()
        self.assertEqual(job_published_active.status, JobPost.STATUS.PUBLISH)

        # 3. Tin PENDING dù hết hạn -> Vẫn giữ nguyên PENDING
        job_pending_expired.refresh_from_db()
        self.assertEqual(job_pending_expired.status, JobPost.STATUS.PENDING)

        # 4. Tin REJECTED dù hết hạn -> Vẫn giữ nguyên REJECTED
        job_rejected_expired.refresh_from_db()
        self.assertEqual(job_rejected_expired.status, JobPost.STATUS.REJECTED)

    @patch('celery.app.task.Task.delay')
    def test_pending_not_in_public_list(self, mock_delay):
        """C3: Tin chưa được duyệt (PENDING), bị từ chối (REJECTED), hoặc đã đóng (CLOSED) không xuất hiện ở danh sách public."""
        company = make_company(verification_level=2)
        tomorrow = timezone.localdate() + timedelta(days=15)

        pending_job = make_job(company=company, status="PENDING", expiration_date=tomorrow)
        rejected_job = make_job(company=company, status="REJECTED", expiration_date=tomorrow)
        closed_job = make_job(company=company, status="CLOSED", expiration_date=tomorrow)
        published_job = make_job(company=company, status="PUBLISHED", expiration_date=tomorrow)

        url = '/api/jobs/jobposts/public/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Danh sách kết quả công khai
        public_job_ids = [item['id'] for item in response.data.get('results', [])]

        # Tin PUBLISHED phải có trong kết quả
        self.assertIn(published_job.id, public_job_ids)

        # Các tin PENDING, REJECTED, CLOSED tuyệt đối không xuất hiện
        self.assertNotIn(pending_job.id, public_job_ids)
        self.assertNotIn(rejected_job.id, public_job_ids)
        self.assertNotIn(closed_job.id, public_job_ids)

        # Khi người dùng xem chi tiết tin PENDING trực tiếp -> Bị từ chối quyền truy cập (403)
        detail_url = f'/api/jobs/jobposts/{pending_job.id}/'
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_403_FORBIDDEN)
