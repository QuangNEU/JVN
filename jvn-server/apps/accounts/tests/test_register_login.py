from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account, Company, JobSeeker
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class RegisterLoginTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo tài khoản mẫu để test login
        self.existing_password = "SecurePassword123!@#"
        self.existing_account = make_account(
            role=Account.ROLE_CHOICES.SEEKER,
            email="existing_user@example.com",
            password=self.existing_password,
            name="Existing User",
        )

    def test_register_seeker_success(self):
        """Đăng ký tài khoản Ứng viên (SEEKER) thành công và nhận cặp JWT token."""
        url = '/api/accounts/register/'
        payload = {
            'email': 'new_seeker@example.com',
            'password': 'StrongPassword123!@#',
            'role': 'SEEKER',
            'name': 'Nguyễn Văn A',
            'tel': '0987654321',
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data.get('role'), 'SEEKER')

        account = Account.objects.get(email='new_seeker@example.com')
        self.assertEqual(account.role, Account.ROLE_CHOICES.SEEKER)
        self.assertTrue(JobSeeker.objects.filter(account=account).exists())

    def test_register_company_success(self):
        """Đăng ký tài khoản Nhà tuyển dụng (COMPANY) đầy đủ thông tin thành công."""
        url = '/api/accounts/register/'
        payload = {
            'email': 'new_company@example.com',
            'password': 'StrongPassword123!@#',
            'role': 'COMPANY',
            'name': 'FPT Software',
            'tel': '0987654322',
            'province': 'Hà Nội',
            'ward': 'Cầu Giấy',
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertEqual(response.data.get('role'), 'COMPANY')

        account = Account.objects.get(email='new_company@example.com')
        self.assertEqual(account.role, Account.ROLE_CHOICES.COMPANY)
        self.assertTrue(Company.objects.filter(account=account).exists())

    def test_register_company_missing_required_fields(self):
        """Nhà tuyển dụng đăng ký thiếu province/ward/tel bị chặn 400 Bad Request."""
        url = '/api/accounts/register/'
        payload = {
            'email': 'invalid_company@example.com',
            'password': 'StrongPassword123!@#',
            'role': 'COMPANY',
            'name': 'Incomplete Company',
            # Thiếu province, ward, tel
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Account.objects.filter(email='invalid_company@example.com').exists())

    def test_register_duplicate_email_fails(self):
        """Đăng ký với email đã tồn tại bị chặn 400 Bad Request."""
        url = '/api/accounts/register/'
        payload = {
            'email': self.existing_account.email,
            'password': 'StrongPassword123!@#',
            'role': 'SEEKER',
            'name': 'Duplicate User',
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('da ton tai', str(response.data))

    def test_login_success(self):
        """Đăng nhập đúng email và mật khẩu trả về 200 OK kèm access và refresh token."""
        url = '/api/accounts/login/'
        payload = {
            'email': self.existing_account.email,
            'password': self.existing_password,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data.get('email'), self.existing_account.email)

    def test_login_wrong_password(self):
        """Đăng nhập sai mật khẩu trả về 401 Unauthorized."""
        url = '/api/accounts/login/'
        payload = {
            'email': self.existing_account.email,
            'password': 'WrongPassword123!',
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_locked_or_inactive_account(self):
        """Tài khoản bị vô hiệu hóa (is_active=False) đăng nhập bị trả về 401 Unauthorized."""
        self.existing_account.is_active = False
        self.existing_account.save(update_fields=['is_active'])

        url = '/api/accounts/login/'
        payload = {
            'email': self.existing_account.email,
            'password': self.existing_password,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
