from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from jobs.models import JobPost
from notifications.models import Notification
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_job,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class JobPostWorkflowTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('celery.app.task.Task.delay')
    def test_suspicious_content_goes_pending(self, mock_delay):
        """B1: Tin có nội dung nghi ngờ qua bộ lọc content-check."""
        company = make_company(verification_level=2)
        self.client.force_authenticate(user=company.account)

        data = {
            'title': 'Tuyển dụng việc nhẹ lương cao kiếm tiền nhanh',
            'descriptions': 'Công việc việc nhẹ lương cao, thu nhập khủng mỗi ngày dành cho mọi người tham gia kiếm tiền tại nhà.',
            'requirement': 'Không cần bằng cấp hay kinh nghiệm gì cả.',
            'benefit': 'Lương 50 triệu một tháng.',
            'type': 'FULLTIME',
            'level': 'JUNIOR',
            'experience_requirement': 'Không yêu cầu',
            'headcount': 5,
            'salary_min': 20000000,
            'salary_max': 50000000,
        }
        url = '/api/jobs/jobposts/'
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        job_post = JobPost.objects.get(id=response.data['id'])
        # Trong code thực tế: content-check nghi ngờ sẽ gán REJECTED kèm reason
        self.assertIn(job_post.status, [JobPost.STATUS.PENDING, JobPost.STATUS.REJECTED])
        if job_post.status == JobPost.STATUS.REJECTED:
            self.assertIsNotNone(job_post.rejected_reason)

    @patch('celery.app.task.Task.delay')
    def test_clean_content_goes_pending_or_published(self, mock_delay):
        """B2: Tin có nội dung sạch chuyển vào PENDING chờ Admin duyệt."""
        company = make_company(verification_level=2)
        self.client.force_authenticate(user=company.account)

        data = {
            'title': 'Senior Python Backend Engineer',
            'descriptions': 'Chúng tôi cần tuyển dụng lập trình viên Python Django có trên 2 năm kinh nghiệm làm việc với hệ thống phân tán.',
            'requirement': 'Thành thạo Python, Django, REST framework và Docker.',
            'benefit': 'Mức lương cạnh tranh, thưởng tháng 13 và bảo hiểm đầy đủ.',
            'type': 'FULLTIME',
            'level': 'JUNIOR',
            'experience_requirement': '2 năm',
            'headcount': 2,
            'salary_min': 15000000,
            'salary_max': 30000000,
        }
        url = '/api/jobs/jobposts/'
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        job_post = JobPost.objects.get(id=response.data['id'])
        # Nghiệp vụ: tin sạch được đưa vào PENDING chờ duyệt
        self.assertEqual(job_post.status, JobPost.STATUS.PENDING)
        self.assertIsNone(job_post.rejected_reason)

    @patch('celery.app.task.Task.delay')
    def test_auto_rejected_by_content_check(self, mock_delay):
        """B3: Tin chứa từ khóa nghi ngờ bị tự động REJECTED và lưu lý do từ chối."""
        company = make_company(verification_level=2)
        self.client.force_authenticate(user=company.account)

        data = {
            'title': 'Công việc việc nhẹ lương cao chuyển khoản trước',
            'descriptions': 'Tuyển nhân viên nhập liệu chuyển khoản trước nhận hoa hồng cao ngay trong ngày.',
            'requirement': 'Có tài khoản ngân hàng để chuyển khoản trước.',
            'benefit': 'Nhận tiền ngay.',
            'type': 'PARTTIME',
            'level': 'INTERN',
            'experience_requirement': 'Không cần',
            'headcount': 10,
            'salary_min': 10000000,
            'salary_max': 20000000,
        }
        url = '/api/jobs/jobposts/'
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        job_post = JobPost.objects.get(id=response.data['id'])
        self.assertEqual(job_post.status, JobPost.STATUS.REJECTED)
        self.assertIsNotNone(job_post.rejected_reason)
        self.assertTrue(
            'việc nhẹ lương cao' in job_post.rejected_reason
            or 'chuyển khoản trước' in job_post.rejected_reason
        )

        # Company nhận thông báo từ chối tự động
        notif_exists = Notification.objects.filter(
            recipient=company.account,
            message__icontains='bị từ chối'
        ).exists()
        self.assertTrue(notif_exists)

    @patch('celery.app.task.Task.delay')
    def test_edit_content_resets_to_pending(self, mock_delay):
        """B4: Khi sửa nội dung tin đang PUBLISHED, tin bị reset về PENDING (nếu sạch) hoặc REJECTED (nếu nghi ngờ)."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        job = make_job(company=company, status="PUBLISHED")

        self.client.force_authenticate(user=company.account)
        url = f'/api/jobs/jobposts/{job.id}/'

        # Sửa nội dung hợp lệ -> reset về PENDING
        update_data = {
            'title': 'Lead Python Architect',
            'descriptions': 'Mô tả công việc được cập nhật mới hoàn toàn, đảm bảo chất lượng và trên 50 ký tự theo yêu cầu hệ thống.',
        }
        response = self.client.patch(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        job.refresh_from_db()
        self.assertEqual(job.status, JobPost.STATUS.PENDING)
        self.assertEqual(job.title, 'Lead Python Architect')

        # Tiếp tục sửa với từ khóa nghi ngờ -> tự động chuyển sang REJECTED
        bad_update_data = {
            'title': 'Lead Python việc nhẹ lương cao',
        }
        response2 = self.client.patch(url, bad_update_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        job.refresh_from_db()
        self.assertEqual(job.status, JobPost.STATUS.REJECTED)
        self.assertIsNotNone(job.rejected_reason)

    @patch('celery.app.task.Task.delay')
    def test_approve_only_pending(self, mock_delay):
        """B5: Chỉ có thể duyệt (approve) tin đang ở trạng thái PENDING."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)

        # 1. Job đang PENDING -> Admin duyệt thành công
        pending_job = make_job(company=company, status="PENDING")
        self.client.force_authenticate(user=admin)
        url_approve = f'/api/jobs/job-post/{pending_job.id}/approve/'

        response = self.client.post(url_approve)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pending_job.refresh_from_db()
        self.assertEqual(pending_job.status, JobPost.STATUS.PUBLISH)

        # 2. Job đang PUBLISHED -> Duyệt lại bị từ chối (404 Not Found do filter status=PENDING)
        response_published = self.client.post(url_approve)
        self.assertEqual(response_published.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Job đang REJECTED -> Duyệt bị từ chối (404 Not Found)
        rejected_job = make_job(company=company, status="REJECTED")
        url_reject_approve = f'/api/jobs/job-post/{rejected_job.id}/approve/'
        response_rejected = self.client.post(url_reject_approve)
        self.assertEqual(response_rejected.status_code, status.HTTP_404_NOT_FOUND)

        # 4. User không phải Admin (Company) cố approve -> 403 Forbidden
        pending_job2 = make_job(company=company, status="PENDING")
        self.client.force_authenticate(user=company.account)
        url_company_approve = f'/api/jobs/job-post/{pending_job2.id}/approve/'
        response_forbidden = self.client.post(url_company_approve)
        self.assertEqual(response_forbidden.status_code, status.HTTP_403_FORBIDDEN)
