from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from reports.models import Report
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_job,
    make_seeker,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class ReportServiceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('celery.app.task.Task.delay')
    def test_duplicate_job_report_blocked(self, mock_delay):
        """D1: Seeker báo cáo trùng cùng 1 tin tuyển dụng phải bị chặn (400), DB chỉ lưu 1 bản ghi."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        make_seeker(seeker_account)
        company = make_company(verification_level=2)
        job = make_job(company=company, status="PUBLISHED")

        self.client.force_authenticate(user=seeker_account)
        url = '/api/reports/'
        data = {
            'target_type': Report.TargetType.JOB_POST,
            'target_id': job.id,
            'reason': 'Tin đăng có dấu hiệu lừa đảo tuyển dụng.',
        }

        # Lần 1: Thành công tạo report
        response1 = self.client.post(url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.filter(reporter=seeker_account, job_post=job).count(), 1)

        # Lần 2: Báo cáo trùng -> Bị chặn 400 Bad Request
        response2 = self.client.post(url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Report.objects.filter(reporter=seeker_account, job_post=job).count(), 1)

    @patch('celery.app.task.Task.delay')
    def test_duplicate_company_report_blocked(self, mock_delay):
        """D2: Seeker báo cáo trùng cùng 1 công ty phải bị chặn (400), DB chỉ lưu 1 bản ghi."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        make_seeker(seeker_account)
        company = make_company(verification_level=2)

        self.client.force_authenticate(user=seeker_account)
        url = '/api/reports/'
        data = {
            'target_type': Report.TargetType.COMPANY,
            'target_id': company.account_id,
            'reason': 'Công ty mạo danh doanh nghiệp khác.',
        }

        # Lần 1: Thành công tạo report
        response1 = self.client.post(url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.filter(reporter=seeker_account, company=company).count(), 1)

        # Lần 2: Báo cáo trùng -> Bị chặn 400 Bad Request
        response2 = self.client.post(url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Report.objects.filter(reporter=seeker_account, company=company).count(), 1)

    @patch('celery.app.task.Task.delay')
    def test_only_seeker_can_report(self, mock_delay):
        """D3: Chỉ Seeker mới có quyền gửi báo cáo. Company bị chặn 403, Anonymous bị chặn 401."""
        company = make_company(verification_level=2)
        job = make_job(company=company, status="PUBLISHED")
        url = '/api/reports/'
        data = {
            'target_type': Report.TargetType.JOB_POST,
            'target_id': job.id,
            'reason': 'Test quyền báo cáo.',
        }

        # 1. Anonymous chưa đăng nhập -> 401
        response_anon = self.client.post(url, data, format='json')
        self.assertEqual(response_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Company cố tình gửi báo cáo -> 403 Forbidden
        self.client.force_authenticate(user=company.account)
        response_comp = self.client.post(url, data, format='json')
        self.assertEqual(response_comp.status_code, status.HTTP_403_FORBIDDEN)

    @patch('celery.app.task.Task.delay')
    def test_resolve_cascades_to_other_pending(self, mock_delay):
        """D4: Admin duyệt 1 report thì các report PENDING khác cùng target tự động chuyển RESOLVED."""
        company = make_company(verification_level=2)
        job = make_job(company=company, status="PUBLISHED")
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)

        # 3 Seeker khác nhau cùng báo cáo 1 tin tuyển dụng
        seeker1 = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker2 = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker3 = make_account(role=Account.ROLE_CHOICES.SEEKER)

        r1 = Report.objects.create(reporter=seeker1, job_post=job, target_type=Report.TargetType.JOB_POST, reason='Lý do 1')
        r2 = Report.objects.create(reporter=seeker2, job_post=job, target_type=Report.TargetType.JOB_POST, reason='Lý do 2')
        r3 = Report.objects.create(reporter=seeker3, job_post=job, target_type=Report.TargetType.JOB_POST, reason='Lý do 3')

        # Admin duyệt báo cáo r1
        self.client.force_authenticate(user=admin)
        url = f'/api/reports/{r1.id}/resolve/'
        admin_note = 'Đã xác minh và xử lý vi phạm.'
        response = self.client.post(url, {'admin_note': admin_note}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Báo cáo được duyệt trực tiếp mang admin_note của admin
        r1.refresh_from_db()
        self.assertEqual(r1.status, Report.Status.RESOLVED)
        self.assertEqual(r1.admin_note, admin_note)
        self.assertIsNotNone(r1.reviewed_at)

        # 2 báo cáo PENDING còn lại tự động cascade sang RESOLVED kèm cascade note
        r2.refresh_from_db()
        r3.refresh_from_db()
        self.assertEqual(r2.status, Report.Status.RESOLVED)
        self.assertEqual(r3.status, Report.Status.RESOLVED)
        self.assertEqual(r2.admin_note, 'Tự động xử lý theo báo cáo trùng lặp đã được duyệt.')
        self.assertEqual(r3.admin_note, 'Tự động xử lý theo báo cáo trùng lặp đã được duyệt.')
        self.assertIsNotNone(r2.reviewed_at)
        self.assertIsNotNone(r3.reviewed_at)

    @patch('celery.app.task.Task.delay')
    def test_dismiss_cascades_and_requires_note(self, mock_delay):
        """D5: Dismiss báo cáo bắt buộc phải có admin_note và cascade sang DISMISSED cho các report cùng mục tiêu."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)

        seeker1 = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker2 = make_account(role=Account.ROLE_CHOICES.SEEKER)

        r1 = Report.objects.create(reporter=seeker1, company=company, target_type=Report.TargetType.COMPANY, reason='Mạo danh 1')
        r2 = Report.objects.create(reporter=seeker2, company=company, target_type=Report.TargetType.COMPANY, reason='Mạo danh 2')

        self.client.force_authenticate(user=admin)
        url = f'/api/reports/{r1.id}/dismiss/'

        # 1. Dismiss không có admin_note -> Lỗi 400
        res_empty = self.client.post(url, {}, format='json')
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_empty.data.get('field'), 'admin_note')

        # 2. Dismiss có admin_note hợp lệ -> Thành công 200
        dismiss_note = 'Báo cáo không có căn cứ xác thực.'
        res_valid = self.client.post(url, {'admin_note': dismiss_note}, format='json')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)

        r1.refresh_from_db()
        self.assertEqual(r1.status, Report.Status.DISMISSED)
        self.assertEqual(r1.admin_note, dismiss_note)

        # r2 tự động chuyển DISMISSED theo cascade
        r2.refresh_from_db()
        self.assertEqual(r2.status, Report.Status.DISMISSED)
        self.assertEqual(r2.admin_note, 'Tự động bỏ qua theo báo cáo trùng lặp đã được xử lý.')

    @patch('celery.app.task.Task.delay')
    def test_second_admin_gets_409(self, mock_delay):
        """D6: Khi Admin 2 cố xử lý báo cáo đã được giải quyết hoặc bác bỏ trước đó, trả về HTTP 409 Conflict."""
        company = make_company(verification_level=2)
        job = make_job(company=company, status="PUBLISHED")
        admin1 = make_account(role=Account.ROLE_CHOICES.ADMIN)
        admin2 = make_account(role=Account.ROLE_CHOICES.ADMIN)

        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER)
        report = Report.objects.create(reporter=seeker, job_post=job, target_type=Report.TargetType.JOB_POST, reason='Nội dung nhạy cảm')

        # Admin 1 xử lý resolve thành công
        self.client.force_authenticate(user=admin1)
        res1 = self.client.post(f'/api/reports/{report.id}/resolve/', {'admin_note': 'Xong'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Admin 2 cũng bấm resolve cùng báo cáo đó -> Bị 409 Conflict
        self.client.force_authenticate(user=admin2)
        res2 = self.client.post(f'/api/reports/{report.id}/resolve/', {'admin_note': 'Tôi duyệt lại'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('admin khác xử lý', str(res2.data))

        # Admin 2 thử dismiss báo cáo đã resolve -> Cũng bị 409 Conflict
        res3 = self.client.post(f'/api/reports/{report.id}/dismiss/', {'admin_note': 'Tôi muốn hủy'}, format='json')
        self.assertEqual(res3.status_code, status.HTTP_409_CONFLICT)

    @patch('celery.app.task.Task.delay')
    def test_admin_list_reports_filter(self, mock_delay):
        """D7: Admin lấy danh sách báo cáo và lọc chính xác theo trạng thái (PENDING, RESOLVED, DISMISSED)."""
        company = make_company(verification_level=2)
        job = make_job(company=company, status="PUBLISHED")
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER)

        r_pending = Report.objects.create(reporter=seeker, job_post=job, target_type=Report.TargetType.JOB_POST, reason='Pending', status=Report.Status.PENDING)
        r_resolved = Report.objects.create(reporter=seeker, company=company, target_type=Report.TargetType.COMPANY, reason='Resolved', status=Report.Status.RESOLVED)

        self.client.force_authenticate(user=admin)
        url = '/api/reports/admin/'

        # 1. Lấy tất cả báo cáo
        res_all = self.client.get(url)
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        ids_all = [item['id'] for item in res_all.data.get('results', [])]
        self.assertIn(r_pending.id, ids_all)
        self.assertIn(r_resolved.id, ids_all)

        # 2. Lọc chỉ lấy PENDING
        res_pending = self.client.get(url, {'status': 'PENDING'})
        self.assertEqual(res_pending.status_code, status.HTTP_200_OK)
        ids_pending = [item['id'] for item in res_pending.data.get('results', [])]
        self.assertIn(r_pending.id, ids_pending)
        self.assertNotIn(r_resolved.id, ids_pending)

        # 3. Lọc chỉ lấy RESOLVED
        res_resolved = self.client.get(url, {'status': 'RESOLVED'})
        self.assertEqual(res_resolved.status_code, status.HTTP_200_OK)
        ids_resolved = [item['id'] for item in res_resolved.data.get('results', [])]
        self.assertNotIn(r_pending.id, ids_resolved)
        self.assertIn(r_resolved.id, ids_resolved)
