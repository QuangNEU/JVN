from datetime import timedelta
from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from applications.models import Application
from applications.services import get_application_status_message
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_cv,
    make_job,
    make_seeker,
)
from notifications.models import Notification


@override_settings(CACHES=TEST_CACHES_SETTING)
class ApplicationReviewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo Company 1 và Job 1
        self.company_account1 = make_account(role=Account.ROLE_CHOICES.COMPANY, email="comp1_rev@example.com")
        self.company1 = make_company(account=self.company_account1, verification_level=2)
        self.job1 = make_job(company=self.company1, status="PUBLISHED")

        # Tạo Company 2 và Job 2
        self.company_account2 = make_account(role=Account.ROLE_CHOICES.COMPANY, email="comp2_rev@example.com")
        self.company2 = make_company(account=self.company_account2, verification_level=2)
        self.job2 = make_job(company=self.company2, status="PUBLISHED")

        # Tạo Seeker và CV
        self.seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER, email="seeker_rev@example.com")
        self.seeker = make_seeker(account=self.seeker_account)
        self.cv = make_cv(seeker=self.seeker)

        # Tạo Application nộp vào Job 1
        self.application = Application.objects.create(
            applicant=self.seeker,
            job_post=self.job1,
            cv=self.cv,
            status=Application.Status.SENT,
            cover_letter="Tôi rất mong muốn được ứng tuyển vào vị trí này.",
        )

    def test_interview_requires_date(self):
        """H1: Chuyển trạng thái INTERVIEWING thiếu ngày phỏng vấn -> Lỗi 400 Bad Request."""
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/applications/update_status/{self.application.id}'

        # 1. Gửi status INTERVIEWING nhưng không có trường interview_date
        res_missing = self.client.patch(url, {'status': Application.Status.INTERVIEWING}, format='json')
        self.assertEqual(res_missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_missing.data.get('field'), 'interview_date')
        self.assertIn('thời gian phỏng vấn', str(res_missing.data.get('error', '')))

        # 2. Gửi status INTERVIEWING với interview_date là None / rỗng
        res_null = self.client.patch(url, {'status': Application.Status.INTERVIEWING, 'interview_date': None}, format='json')
        self.assertEqual(res_null.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_null.data.get('field'), 'interview_date')

        # Đảm bảo trạng thái trong DB không bị thay đổi
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.SENT)
        self.assertIsNone(self.application.interview_date)

    @patch('celery.app.task.Task.delay')
    def test_update_status_interviewing_success(self, mock_delay):
        """H2: Chuyển trạng thái INTERVIEWING có ngày phỏng vấn -> Thành công 200 và gửi thông báo cho Seeker."""
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/applications/update_status/{self.application.id}'

        interview_time = timezone.now() + timedelta(days=3)
        payload = {
            'status': Application.Status.INTERVIEWING,
            'interview_date': interview_time.isoformat(),
        }

        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Kiểm tra DB đã cập nhật trạng thái và thời gian phỏng vấn
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.INTERVIEWING)
        self.assertIsNotNone(self.application.interview_date)

        # Kiểm tra thông báo gửi tới Seeker
        notif = Notification.objects.filter(recipient=self.seeker_account).latest('created_at')
        self.assertIn('phỏng vấn', notif.message)
        self.assertIn(self.job1.title, notif.message)
        self.assertEqual(notif.link, f'/jobs/{self.job1.id}')

    @patch('celery.app.task.Task.delay')
    def test_reject_application_stores_reason(self, mock_delay):
        """H3: Chuyển trạng thái REJECTED lưu chính xác rejected_reason và gửi thông báo."""
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/applications/update_status/{self.application.id}'

        reason = 'Hồ sơ chưa đáp ứng đủ số năm kinh nghiệm yêu cầu của dự án.'
        payload = {
            'status': Application.Status.REJECTED,
            'rejected_reason': reason,
        }

        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Kiểm tra DB lưu trạng thái REJECTED và lý do từ chối
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.REJECTED)
        self.assertEqual(self.application.rejected_reason, reason)

        # Kiểm tra thông báo gửi tới Seeker
        notif = Notification.objects.filter(recipient=self.seeker_account).latest('created_at')
        self.assertIn('chưa phù hợp', notif.message)
        self.assertEqual(notif.link, f'/jobs/{self.job1.id}')

    def test_other_company_cannot_update_application(self):
        """H4: Công ty khác sửa đơn của công ty mình -> 404 (chống IDOR); Seeker sửa đơn -> 403."""
        url = f'/api/applications/update_status/{self.application.id}'

        # 1. Company 2 cố tình sửa đơn ứng tuyển vào tin của Company 1 -> 404 Not Found
        self.client.force_authenticate(user=self.company_account2)
        res_comp2 = self.client.patch(url, {'status': Application.Status.SUITABLE}, format='json')
        self.assertEqual(res_comp2.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Seeker cố tình sửa đơn ứng tuyển của chính mình -> 403 Forbidden
        self.client.force_authenticate(user=self.seeker_account)
        res_seeker = self.client.patch(url, {'status': Application.Status.HIRED}, format='json')
        self.assertEqual(res_seeker.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Anonymous chưa đăng nhập -> 401 Unauthorized
        self.client.logout()
        res_anon = self.client.patch(url, {'status': Application.Status.SUITABLE}, format='json')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Đảm bảo trạng thái đơn trong DB không bị thay đổi
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.SENT)

    @patch('celery.app.task.Task.delay')
    def test_all_status_transitions_and_notification_messages(self, mock_delay):
        """Kiểm thử bao phủ toàn bộ các trạng thái còn lại (RECEIVED, WATCHED, SUITABLE, HIRED) và hàm tạo message."""
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/applications/update_status/{self.application.id}'

        statuses_to_test = [
            (Application.Status.RECEIVED, 'tiếp nhận hồ sơ'),
            (Application.Status.WATCHED, 'vừa xem CV'),
            (Application.Status.SUITABLE, 'rất phù hợp'),
            (Application.Status.HIRED, 'trúng tuyển'),
        ]

        for new_status, expected_phrase in statuses_to_test:
            with self.subTest(status=new_status):
                res = self.client.patch(url, {'status': new_status}, format='json')
                self.assertEqual(res.status_code, status.HTTP_200_OK)

                self.application.refresh_from_db()
                self.assertEqual(self.application.status, new_status)

                notif = Notification.objects.filter(recipient=self.seeker_account).latest('created_at')
                self.assertIn(expected_phrase, notif.message)

        # Unit test hàm helper get_application_status_message với fallback
        fallback_msg = get_application_status_message('UNKNOWN_STATUS', 'Software Engineer')
        self.assertIn('Software Engineer', fallback_msg)
        self.assertIn('vừa được cập nhật', fallback_msg)
