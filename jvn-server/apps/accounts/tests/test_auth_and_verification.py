import time
from unittest.mock import patch
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from accounts.models import Account, Company
from accounts.services import (
    confirm_email_verification_service,
    generate_email_verification_token,
    send_email_verification_service,
    verify_email_verification_token,
)
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
)
from core.validator import validate_file


TEST_STORAGES_SETTING = {
    "default": {
        "BACKEND": "django.core.files.storage.InMemoryStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}


@override_settings(
    CACHES=TEST_CACHES_SETTING,
    STORAGES=TEST_STORAGES_SETTING,
    DEFAULT_FILE_STORAGE='django.core.files.storage.InMemoryStorage',
)
class AuthAndVerificationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo tài khoản công ty phục vụ nộp giấy chứng nhận
        self.company_account = make_account(
            role=Account.ROLE_CHOICES.COMPANY,
            email="company_verify@example.com",
            email_verified=True,
        )
        self.company = make_company(account=self.company_account, verification_level=1)

        # Tạo tài khoản chưa xác thực email
        self.unverified_account = make_account(
            role=Account.ROLE_CHOICES.SEEKER,
            email="unverified_user@example.com",
            email_verified=False,
        )

    def test_upload_file_oversize_rejected(self):
        """I1: Upload file vượt quá giới hạn 5MB bị từ chối (HTTP 400 và ValidationError)."""
        self.client.force_authenticate(user=self.company_account)
        url = '/api/accounts/business-cert/submit/'

        # Tạo file 5MB + 1 byte
        oversize_content = b'0' * (5 * 1024 * 1024 + 1)
        oversize_file = SimpleUploadedFile("oversize_cert.pdf", oversize_content, content_type="application/pdf")

        # 1. Gọi API nộp file quá cỡ -> 400 Bad Request
        response = self.client.post(url, {'document': oversize_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('field'), 'file')
        self.assertIn('5MB', str(response.data.get('error', '')))

        # 2. Unit test trực tiếp hàm validate_file
        oversize_test_file = SimpleUploadedFile("cert_huge.pdf", oversize_content, content_type="application/pdf")
        with self.assertRaises(ValidationError) as ctx:
            validate_file(oversize_test_file)
        self.assertIn('quá lớn', str(ctx.exception))

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'test', 'version': 1, 'url': 'http://test.url'})
    def test_upload_file_invalid_mime_rejected(self, mock_upload):
        """I2: File giả mạo extension hoặc sai MIME Type bị từ chối (HTTP 400 và ValidationError)."""
        self.client.force_authenticate(user=self.company_account)
        url = '/api/accounts/business-cert/submit/'

        # 1. Extension không hợp lệ (.exe)
        invalid_ext_file = SimpleUploadedFile("malware.exe", b'fake binary executable content', content_type="application/pdf")
        res_ext = self.client.post(url, {'document': invalid_ext_file}, format='multipart')
        self.assertEqual(res_ext.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_ext.data.get('field'), 'file')
        self.assertIn('không được hỗ trợ', str(res_ext.data.get('error', '')))

        # 2. MIME type không hợp lệ (ví dụ: file .pdf nhưng header là application/x-msdownload)
        spoofed_mime_file = SimpleUploadedFile("fake.pdf", b'some content', content_type="application/x-msdownload")
        res_mime = self.client.post(url, {'document': spoofed_mime_file}, format='multipart')
        self.assertEqual(res_mime.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_mime.data.get('field'), 'file')
        self.assertIn('Nội dung file không hợp lệ', str(res_mime.data.get('error', '')))

        # 3. Unit test trực tiếp validate_file
        with self.assertRaises(ValidationError):
            validate_file(SimpleUploadedFile("script.sh", b'echo hello', content_type="text/x-shellscript"))

        # validate_file với None -> Không raise lỗi
        self.assertIsNone(validate_file(None))

        # 4. Positive test: File hợp lệ (PDF < 5MB) -> 200 OK
        valid_file = SimpleUploadedFile("valid_business_license.pdf", b'%PDF-1.4 sample content', content_type="application/pdf")
        res_valid = self.client.post(url, {'document': valid_file}, format='multipart')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)

        self.company.refresh_from_db()
        self.assertEqual(self.company.business_cert_status, Company.CertStatus.PENDING)
        self.assertTrue(self.company.business_cert_document.name.endswith('.pdf'))

    def test_expired_email_token_rejected(self):
        """I3: Token xác thực email quá thời hạn 30 phút hoặc không hợp lệ bị từ chối (HTTP 400)."""
        token = generate_email_verification_token(account_id=self.unverified_account.id)
        url = '/api/accounts/email/confirm/'

        # 1. Token quá 30 phút (1800s + 1s) -> 400 Bad Request
        with patch('time.time', return_value=time.time() + 1801):
            response_expired = self.client.post(url, {'token': token}, format='json')
            self.assertEqual(response_expired.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('expired or invalid', str(response_expired.data))

        # Đảm bảo account vẫn chưa được xác thực
        self.unverified_account.refresh_from_db()
        self.assertFalse(self.unverified_account.email_verified)

        # 2. Token bị giả mạo / sai chữ ký -> 400 Bad Request
        tampered_token = f"{token}_tampered"
        response_tampered = self.client.post(url, {'token': tampered_token}, format='json')
        self.assertEqual(response_tampered.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Thiếu token -> 400 Bad Request
        response_empty = self.client.post(url, {}, format='json')
        self.assertEqual(response_empty.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Unit test trực tiếp verify_email_verification_token
        with patch('time.time', return_value=time.time() + 1801):
            with self.assertRaises(ValidationError):
                verify_email_verification_token(token=token)

    def test_valid_email_token_verified(self):
        """I4: Token xác thực hợp lệ chuyển email_verified=True thành công (HTTP 200)."""
        self.assertFalse(self.unverified_account.email_verified)
        token = generate_email_verification_token(account_id=self.unverified_account.id)
        url = '/api/accounts/email/confirm/'

        # Lần 1: Xác thực thành công
        response = self.client.post(url, {'token': token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Verify successfully', str(response.data))

        self.unverified_account.refresh_from_db()
        self.assertTrue(self.unverified_account.email_verified)

        # Lần 2: Gọi lại token cho tài khoản đã xác thực trước đó -> Vẫn 200 an toàn (idempotent)
        response_again = self.client.post(url, {'token': token}, format='json')
        self.assertEqual(response_again.status_code, status.HTTP_200_OK)
        self.assertIn('Account has been verified', str(response_again.data))

    @patch('celery.app.task.Task.delay')
    def test_send_email_verification_flow(self, mock_delay):
        """Kiểm thử endpoint gửi email xác thực: tài khoản chưa xác thực gửi được, đã xác thực bị từ chối."""
        url = '/api/accounts/email/send-verification/'

        # 1. Tài khoản chưa xác thực gọi gửi email -> Thành công 200
        self.client.force_authenticate(user=self.unverified_account)
        res_send = self.client.post(url, format='json')
        self.assertEqual(res_send.status_code, status.HTTP_200_OK)
        self.assertIn('Đã gửi email', str(res_send.data))

        # 2. Tài khoản đã xác thực gọi gửi email lại -> Bị chặn 400 Bad Request
        self.client.force_authenticate(user=self.company_account)
        res_already = self.client.post(url, format='json')
        self.assertEqual(res_already.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('đã được xác thực trước đó', str(res_already.data))
