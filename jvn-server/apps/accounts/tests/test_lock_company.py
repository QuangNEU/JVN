from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account, AccountLockHistory
from accounts.services import login_service
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_job,
    make_seeker,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class AccountLockTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('celery.app.task.Task.delay')
    def test_lock_hides_published_jobs_and_logs(self, mock_delay):
        """E1: Khóa Company đặt is_locked=True, ẩn các tin PUBLISHED (is_hidden_by_lock=True) và tạo log."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)

        job_pub = make_job(company=company, status="PUBLISHED")
        job_pending = make_job(company=company, status="PENDING")

        self.client.force_authenticate(user=admin)
        url = f'/api/companies/{company.account.id}/lock-company/'
        reason = 'Vi phạm chính sách tuyển dụng.'
        response = self.client.post(url, {'reason': reason}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 1. Company account is_locked = True
        company.account.refresh_from_db()
        self.assertTrue(company.account.is_locked)

        # 2. Tin PUBLISHED bị ẩn (is_hidden_by_lock=True), tin PENDING không bị ảnh hưởng
        job_pub.refresh_from_db()
        job_pending.refresh_from_db()
        self.assertTrue(job_pub.is_hidden_by_lock)
        self.assertFalse(job_pending.is_hidden_by_lock)

        # 3. Tạo đúng 1 bản ghi AccountLockHistory
        history = AccountLockHistory.objects.filter(account=company.account)
        self.assertEqual(history.count(), 1)
        log = history.first()
        self.assertEqual(log.action, AccountLockHistory.Action.LOCKED)
        self.assertEqual(log.reason, reason)
        self.assertEqual(log.performed_by, admin)

        # 4. Tin bị ẩn không xuất hiện trên danh sách public
        public_res = self.client.get('/api/jobs/jobposts/public/')
        public_ids = [item['id'] for item in public_res.data.get('results', [])]
        self.assertNotIn(job_pub.id, public_ids)

    @patch('celery.app.task.Task.delay')
    def test_unlock_restores_hidden_jobs(self, mock_delay):
        """E2: Mở khóa Company khôi phục is_locked=False, hiện lại các tin bị ẩn và tạo log UNLOCKED."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        job_pub = make_job(company=company, status="PUBLISHED")

        self.client.force_authenticate(user=admin)
        # Khóa trước
        self.client.post(f'/api/companies/{company.account.id}/lock-company/', {'reason': 'Khóa tạm thời'}, format='json')

        # Mở khóa
        url_unlock = f'/api/companies/{company.account.id}/unlock-company/'
        response = self.client.post(url_unlock)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 1. Company account is_locked = False
        company.account.refresh_from_db()
        self.assertFalse(company.account.is_locked)

        # 2. Tin được khôi phục is_hidden_by_lock = False
        job_pub.refresh_from_db()
        self.assertFalse(job_pub.is_hidden_by_lock)

        # 3. Lịch sử có log UNLOCKED
        unlock_log = AccountLockHistory.objects.filter(account=company.account, action=AccountLockHistory.Action.UNLOCKED)
        self.assertTrue(unlock_log.exists())
        self.assertEqual(unlock_log.first().performed_by, admin)

        # 4. Tin xuất hiện lại trên danh sách public
        public_res = self.client.get('/api/jobs/jobposts/public/')
        public_ids = [item['id'] for item in public_res.data.get('results', [])]
        self.assertIn(job_pub.id, public_ids)

    @patch('celery.app.task.Task.delay')
    def test_locked_account_cannot_login(self, mock_delay):
        """E3: Tài khoản bị khóa không thể đăng nhập (raise ValueError ở service, trả về 401 ở API Login)."""
        password = 'strongpassword123'
        company = make_company(verification_level=2)
        account = company.account
        account.set_password(password)
        account.is_locked = True
        account.save(update_fields=['password', 'is_locked'])

        # 1. Gọi login_service trực tiếp -> Raise ValueError
        with self.assertRaises(ValueError) as ctx:
            login_service(email=account.email, password=password)
        self.assertIn('khoa', str(ctx.exception).lower())

        # 2. Gọi API Login -> 401 Unauthorized
        response = self.client.post('/api/accounts/login/', {'email': account.email, 'password': password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('khoa', str(response.data).lower())

    @patch('celery.app.task.Task.delay')
    def test_locked_session_blocked_by_permission(self, mock_delay):
        """E4: Phiên đăng nhập của tài khoản bị khóa bị chặn 403 Forbidden kèm code=account_locked."""
        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER, is_locked=True)
        make_seeker(seeker)

        self.client.force_authenticate(user=seeker)
        # Gọi endpoint yêu cầu IsAuthenticatedAndNotLocked (ví dụ lấy profile)
        response = self.client.get('/api/accounts/profile/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('code'), 'account_locked')
        self.assertIn('khóa', response.data.get('error', ''))

    @patch('celery.app.task.Task.delay')
    def test_lock_and_unlock_seeker_with_audit_log(self, mock_delay):
        """E5: Khóa và mở khóa Seeker hoạt động chính xác kèm Audit Log."""
        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER)
        make_seeker(seeker)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)

        self.client.force_authenticate(user=admin)
        lock_url = f'/api/accounts/{seeker.id}/lock-seeker/'
        unlock_url = f'/api/accounts/{seeker.id}/unlock-seeker/'

        # Khóa Seeker
        res_lock = self.client.post(lock_url, {'reason': 'Spam ứng tuyển'}, format='json')
        self.assertEqual(res_lock.status_code, status.HTTP_200_OK)
        seeker.refresh_from_db()
        self.assertTrue(seeker.is_locked)

        # Mở khóa Seeker
        res_unlock = self.client.post(unlock_url)
        self.assertEqual(res_unlock.status_code, status.HTTP_200_OK)
        seeker.refresh_from_db()
        self.assertFalse(seeker.is_locked)

        # Audit log có cả 2 hành động
        actions = list(AccountLockHistory.objects.filter(account=seeker).values_list('action', flat=True))
        self.assertIn(AccountLockHistory.Action.LOCKED, actions)
        self.assertIn(AccountLockHistory.Action.UNLOCKED, actions)

    @patch('celery.app.task.Task.delay')
    def test_already_locked_or_unlocked_validation(self, mock_delay):
        """E6: Khóa tài khoản đã bị khóa hoặc mở khóa tài khoản chưa bị khóa báo lỗi 400; Non-admin bị 403."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER)

        # Non-admin cố tình khóa -> 403
        self.client.force_authenticate(user=seeker)
        res_forbidden = self.client.post(f'/api/companies/{company.account.id}/lock-company/', {'reason': 'Hack'}, format='json')
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Admin khóa lần 1 -> 200
        self.client.force_authenticate(user=admin)
        res1 = self.client.post(f'/api/companies/{company.account.id}/lock-company/', {'reason': 'Lý do 1'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Admin khóa lại lần 2 khi đã khóa -> 400 Bad Request
        res2 = self.client.post(f'/api/companies/{company.account.id}/lock-company/', {'reason': 'Lý do 2'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('celery.app.task.Task.delay')
    def test_get_account_lock_history_api(self, mock_delay):
        """E7: Admin xem lịch sử khóa/mở khóa tài khoản; Non-admin bị chặn 403."""
        company = make_company(verification_level=2)
        admin = make_account(role=Account.ROLE_CHOICES.ADMIN)
        seeker = make_account(role=Account.ROLE_CHOICES.SEEKER)

        # Tạo lịch sử
        AccountLockHistory.objects.create(account=company.account, action=AccountLockHistory.Action.LOCKED, reason='Test log', performed_by=admin)

        # Non-admin cố xem lịch sử -> 403
        self.client.force_authenticate(user=seeker)
        res_non_admin = self.client.get(f'/api/accounts/{company.account.id}/lock-history/')
        self.assertEqual(res_non_admin.status_code, status.HTTP_403_FORBIDDEN)

        # Admin xem -> 200 OK kèm danh sách log
        self.client.force_authenticate(user=admin)
        res_admin = self.client.get(f'/api/accounts/{company.account.id}/lock-history/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_admin.data), 1)
        self.assertEqual(res_admin.data[0]['action'], 'LOCKED')
        self.assertEqual(res_admin.data[0]['reason'], 'Test log')
