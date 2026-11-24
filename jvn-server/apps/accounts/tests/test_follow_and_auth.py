from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account, Company, Follow
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_seeker,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class FollowAndAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo Seeker
        self.seeker_account = make_account(
            role=Account.ROLE_CHOICES.SEEKER,
            email="seeker_auth@example.com",
            password="OldPassword123!@#",
        )
        self.seeker = make_seeker(account=self.seeker_account)

        # Tạo Company 1
        self.company_account1 = make_account(
            role=Account.ROLE_CHOICES.COMPANY,
            email="comp1_auth@example.com",
            name="VinTech Corporation",
        )
        self.company1 = make_company(account=self.company_account1, verification_level=2)

        # Tạo Company 2
        self.company_account2 = make_account(
            role=Account.ROLE_CHOICES.COMPANY,
            email="comp2_auth@example.com",
            name="FPT Global",
        )
        self.company2 = make_company(account=self.company_account2, verification_level=2)

    def test_seeker_follow_and_unfollow_company(self):
        """Ứng viên theo dõi và hủy theo dõi công ty (cơ chế toggle)."""
        self.client.force_authenticate(user=self.seeker_account)
        url = f'/api/accounts/follow/{self.company1.account_id}/'

        # Lần 1: Bấm theo dõi -> is_following = True
        res_follow = self.client.post(url, format='json')
        self.assertEqual(res_follow.status_code, status.HTTP_200_OK)
        self.assertTrue(res_follow.data.get('is_following'))
        self.assertTrue(
            Follow.objects.filter(job_seeker=self.seeker, company=self.company1).exists()
        )

        # Kiểm tra trạng thái theo dõi qua API check-following
        status_res = self.client.get(f'/api/accounts/follow/{self.company1.account_id}/status/')
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertTrue(status_res.data.get('is_following'))

        # Lần 2: Bấm lại vào công ty đã theo dõi -> Bỏ theo dõi, is_following = False
        res_unfollow = self.client.post(url, format='json')
        self.assertEqual(res_unfollow.status_code, status.HTTP_200_OK)
        self.assertFalse(res_unfollow.data.get('is_following'))
        self.assertFalse(
            Follow.objects.filter(job_seeker=self.seeker, company=self.company1).exists()
        )

    def test_company_cannot_follow_company(self):
        """Công ty cố tình bấm theo dõi công ty khác bị chặn 400 Bad Request."""
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/accounts/follow/{self.company2.account_id}/'

        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Chi co nguoi tim viec', str(response.data))

    def test_get_my_followed_companies(self):
        """Lấy danh sách các công ty mà ứng viên đang theo dõi thành công."""
        self.client.force_authenticate(user=self.seeker_account)

        # Theo dõi cả 2 công ty
        Follow.objects.create(job_seeker=self.seeker, company=self.company1)
        Follow.objects.create(job_seeker=self.seeker, company=self.company2)

        res = self.client.get('/api/accounts/follow/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        results = res.data.get('results', [])
        followed_names = [item['company']['name'] for item in results]
        self.assertIn("VinTech Corporation", followed_names)
        self.assertIn("FPT Global", followed_names)

    def test_change_password_flow(self):
        """Đổi mật khẩu: thành công khi nhập đúng pass cũ; lỗi 400 khi sai pass cũ hoặc không khớp confirm."""
        self.client.force_authenticate(user=self.seeker_account)
        url = '/api/accounts/password/change/'

        # 1. Nhập sai mật khẩu cũ -> 400 Bad Request
        res_wrong_old = self.client.post(url, {
            'old_password': 'WrongPassword123!@#',
            'new_password': 'NewPassword123!@#',
            'confirm_new_password': 'NewPassword123!@#',
        }, format='json')
        self.assertEqual(res_wrong_old.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Mật khẩu mới trùng mật khẩu cũ -> 400 Bad Request
        res_same = self.client.post(url, {
            'old_password': 'OldPassword123!@#',
            'new_password': 'OldPassword123!@#',
            'confirm_new_password': 'OldPassword123!@#',
        }, format='json')
        self.assertEqual(res_same.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Mật khẩu xác nhận không khớp -> 400 Bad Request
        res_mismatch = self.client.post(url, {
            'old_password': 'OldPassword123!@#',
            'new_password': 'NewPassword123!@#',
            'confirm_new_password': 'DifferentPassword123!@#',
        }, format='json')
        self.assertEqual(res_mismatch.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Hợp lệ -> 200 OK và đăng nhập được bằng mật khẩu mới
        res_success = self.client.post(url, {
            'old_password': 'OldPassword123!@#',
            'new_password': 'NewPassword123!@#',
            'confirm_new_password': 'NewPassword123!@#',
        }, format='json')
        self.assertEqual(res_success.status_code, status.HTTP_200_OK)

        self.seeker_account.refresh_from_db()
        self.assertTrue(self.seeker_account.check_password('NewPassword123!@#'))

    def test_forgot_and_reset_password_flow(self):
        """Quy trình quên mật khẩu và đặt lại mật khẩu bằng token một lần."""
        # 1. Gọi forgot password gửi email
        forgot_url = '/api/accounts/password/forgot/'
        res_forgot = self.client.post(forgot_url, {'email': self.seeker_account.email}, format='json')
        self.assertEqual(res_forgot.status_code, status.HTTP_200_OK)
        self.assertIn('Vui long kiem tra email', str(res_forgot.data))
        self.assertTrue(len(mail.outbox) > 0)

        # 2. Tạo uid và token hợp lệ
        uid = urlsafe_base64_encode(force_bytes(self.seeker_account.pk))
        token = default_token_generator.make_token(self.seeker_account)

        # 3. Đặt lại mật khẩu với token giả mạo -> 400 Bad Request
        reset_url = '/api/accounts/password/reset/'
        res_invalid_token = self.client.post(reset_url, {
            'uid': uid,
            'token': 'invalid_token_123',
            'new_password': 'ResetPass123!@#',
            'confirm_new_password': 'ResetPass123!@#',
        }, format='json')
        self.assertEqual(res_invalid_token.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Đặt lại mật khẩu với token hợp lệ -> 200 OK
        res_reset_success = self.client.post(reset_url, {
            'uid': uid,
            'token': token,
            'new_password': 'ResetPass123!@#',
            'confirm_new_password': 'ResetPass123!@#',
        }, format='json')
        self.assertEqual(res_reset_success.status_code, status.HTTP_200_OK)

        self.seeker_account.refresh_from_db()
        self.assertTrue(self.seeker_account.check_password('ResetPass123!@#'))
