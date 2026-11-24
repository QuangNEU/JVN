from unittest.mock import patch
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_cv,
    make_seeker,
)
from resumes.models import CV, Tag


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
class ResumesTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo Seeker 1
        self.seeker_account1 = make_account(role=Account.ROLE_CHOICES.SEEKER, email="seeker1_cv@example.com")
        self.seeker1 = make_seeker(account=self.seeker_account1)

        # Tạo Seeker 2
        self.seeker_account2 = make_account(role=Account.ROLE_CHOICES.SEEKER, email="seeker2_cv@example.com")
        self.seeker2 = make_seeker(account=self.seeker_account2)

        # Tạo Company
        self.company_account = make_account(role=Account.ROLE_CHOICES.COMPANY, email="comp_cv@example.com")
        self.company = make_company(account=self.company_account, verification_level=2)

        # Tạo sẵn Tags
        self.tag_python = Tag.objects.create(tag_name="Python")
        self.tag_django = Tag.objects.create(tag_name="Django")

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'test', 'version': 1, 'url': 'http://test.url'})
    def test_create_cv_success_and_invalid_file(self, mock_upload):
        """J1: Seeker tạo CV thành công; File quá 5MB hoặc Company tạo CV bị từ chối 400."""
        url = '/api/resumes/cv/'
        self.client.force_authenticate(user=self.seeker_account1)

        # 1. Tạo CV hợp lệ thành công
        valid_file = SimpleUploadedFile("my_cv.pdf", b'%PDF-1.4 sample cv bytes', content_type="application/pdf")
        payload = {
            'title': 'Senior Python Backend CV',
            'level': 'SENIOR',
            'file': valid_file,
            'tag_ids': [self.tag_python.id, self.tag_django.id],
        }
        res_valid = self.client.post(url, payload, format='multipart')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)

        cv = CV.objects.get(title='Senior Python Backend CV')
        self.assertEqual(cv.job_seeker, self.seeker1)
        self.assertEqual(cv.level, 'SENIOR')
        self.assertEqual(set(cv.tags.all()), {self.tag_python, self.tag_django})

        # 2. File quá kích thước 5MB -> 400 Bad Request
        huge_file = SimpleUploadedFile("huge_cv.pdf", b'0' * (5 * 1024 * 1024 + 1), content_type="application/pdf")
        payload_huge = {
            'title': 'Huge CV',
            'level': 'JUNIOR',
            'file': huge_file,
        }
        res_huge = self.client.post(url, payload_huge, format='multipart')
        self.assertEqual(res_huge.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Company cố tình tạo CV -> 400 Bad Request (chỉ seeker mới được tạo)
        self.client.force_authenticate(user=self.company_account)
        res_comp = self.client.post(url, payload, format='multipart')
        self.assertEqual(res_comp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_set_default_cv_unsets_previous_default(self):
        """J2: Đặt CV mới làm mặc định thì CV cũ tự động bỏ cờ is_default."""
        self.client.force_authenticate(user=self.seeker_account1)

        cv1 = make_cv(seeker=self.seeker1, title="CV First", is_default=True)
        cv2 = make_cv(seeker=self.seeker1, title="CV Second", is_default=False)

        # Đặt cv2 làm mặc định
        url = f'/api/resumes/cv/{cv2.id}/set-default/'
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('is_default'))

        cv2.refresh_from_db()
        cv1.refresh_from_db()
        self.assertTrue(cv2.is_default)
        self.assertFalse(cv1.is_default)

    @patch('cloudinary.uploader.destroy', return_value={'result': 'ok'})
    @patch('cloudinary.uploader.upload', return_value={'public_id': 'test', 'version': 1, 'url': 'http://test.url'})
    def test_update_cv_metadata_and_tags(self, mock_upload, mock_destroy):
        """J3: Cập nhật title, level, tags thành công; gán tag_ids không tồn tại báo lỗi 400."""
        self.client.force_authenticate(user=self.seeker_account1)
        cv = make_cv(seeker=self.seeker1, title="Original CV", level="JUNIOR")
        url = f'/api/resumes/cv/{cv.id}/update'

        # 1. Cập nhật title, level và gán tag hợp lệ -> 200 OK
        payload_valid = {
            'title': 'Updated Professional CV',
            'level': 'SENIOR',
            'tag_ids': [self.tag_python.id],
        }
        res_valid = self.client.patch(url, payload_valid, format='json')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)

        cv.refresh_from_db()
        self.assertEqual(cv.title, 'Updated Professional CV')
        self.assertEqual(cv.level, 'SENIOR')
        self.assertEqual(list(cv.tags.all()), [self.tag_python])

        # 2. Gán tag_id không tồn tại trong hệ thống -> 400 Bad Request
        res_invalid_tag = self.client.patch(url, {'tag_ids': [999999]}, format='json')
        self.assertEqual(res_invalid_tag.status_code, status.HTTP_400_BAD_REQUEST)

    def test_toggle_public_cv(self):
        """J4: Bật/tắt trạng thái is_public của CV thành công (toggle logic)."""
        self.client.force_authenticate(user=self.seeker_account1)
        cv = make_cv(seeker=self.seeker1, title="Public Test CV", is_public=False)
        url = f'/api/resumes/cv/{cv.id}/public'

        # Lần 1: Bật public -> is_public = True
        res1 = self.client.post(url, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        cv.refresh_from_db()
        self.assertTrue(cv.is_public)

        # Lần 2: Tắt public -> is_public = False
        res2 = self.client.post(url, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        cv.refresh_from_db()
        self.assertFalse(cv.is_public)

    @patch('cloudinary.uploader.destroy', return_value={'result': 'ok'})
    def test_delete_cv_removes_from_db_and_storage(self, mock_destroy):
        """J5: Xóa CV thành công, xóa bản ghi khỏi DB và gọi lệnh hủy file."""
        self.client.force_authenticate(user=self.seeker_account1)
        cv = make_cv(seeker=self.seeker1, title="CV To Delete")
        url = f'/api/resumes/cv/{cv.id}/'

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(CV.objects.filter(id=cv.id).exists())

    def test_cross_seeker_cv_access_forbidden_idor(self):
        """J6: Seeker 2 cố tình xem/sửa/xóa CV của Seeker 1 bị chặn 403 (chống IDOR)."""
        cv1 = make_cv(seeker=self.seeker1, title="Private Seeker 1 CV", is_public=False)
        self.client.force_authenticate(user=self.seeker_account2)

        # 1. Seeker 2 cố xem chi tiết CV của Seeker 1 -> 403 Forbidden
        res_get = self.client.get(f'/api/resumes/cv/{cv1.id}/')
        self.assertEqual(res_get.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Seeker 2 cố sửa CV của Seeker 1 -> 403 Forbidden
        res_patch = self.client.patch(f'/api/resumes/cv/{cv1.id}/update', {'title': 'Hacked Title'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)
        cv1.refresh_from_db()
        self.assertEqual(cv1.title, "Private Seeker 1 CV")

        # 3. Seeker 2 cố xóa CV của Seeker 1 -> 403 Forbidden
        res_delete = self.client.delete(f'/api/resumes/cv/{cv1.id}/')
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(CV.objects.filter(id=cv1.id).exists())

        # 4. Seeker 2 cố toggle public CV của Seeker 1 -> 403 Forbidden
        res_public = self.client.post(f'/api/resumes/cv/{cv1.id}/public', format='json')
        self.assertEqual(res_public.status_code, status.HTTP_403_FORBIDDEN)
        cv1.refresh_from_db()
        self.assertFalse(cv1.is_public)

    def test_get_cv_list_and_tags(self):
        """Kiểm tra lấy danh sách CV của tôi và danh sách tags công khai."""
        self.client.force_authenticate(user=self.seeker_account1)
        make_cv(seeker=self.seeker1, title="My CV 1")
        make_cv(seeker=self.seeker1, title="My CV 2")

        # 1. Lấy danh sách CV của Seeker 1 -> 200 OK
        res_list = self.client.get('/api/resumes/cv/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in res_list.data]
        self.assertIn("My CV 1", titles)
        self.assertIn("My CV 2", titles)

        # 2. Lấy danh sách tags -> 200 OK
        res_tags = self.client.get('/api/resumes/tags/')
        self.assertEqual(res_tags.status_code, status.HTTP_200_OK)
        tag_names = [t['tag_name'] for t in res_tags.data]
        self.assertIn("Python", tag_names)
        self.assertIn("Django", tag_names)
