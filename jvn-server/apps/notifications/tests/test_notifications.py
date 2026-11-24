from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
)
from notifications.models import Notification


@override_settings(CACHES=TEST_CACHES_SETTING)
class NotificationsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo 2 người dùng để kiểm tra phân quyền & IDOR
        self.user1 = make_account(role=Account.ROLE_CHOICES.SEEKER, email="user1_notif@example.com")
        self.user2 = make_account(role=Account.ROLE_CHOICES.SEEKER, email="user2_notif@example.com")

        # Tạo thông báo cho user 1
        self.notif1 = Notification.objects.create(
            recipient=self.user1,
            message="Tin ứng tuyển của bạn đã được tiếp nhận.",
            link="/jobs/1",
            is_read=False,
        )
        self.notif2 = Notification.objects.create(
            recipient=self.user1,
            message="Nhà tuyển dụng đã mời bạn phỏng vấn.",
            link="/jobs/1",
            is_read=False,
        )

        # Tạo thông báo cho user 2
        self.notif_other = Notification.objects.create(
            recipient=self.user2,
            message="Thông báo riêng của User 2.",
            link="/jobs/2",
            is_read=False,
        )

    def test_list_my_notifications(self):
        """User chỉ lấy được danh sách thông báo của chính mình, không thấy thông báo của người khác."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get('results', [])
        ids = [item['id'] for item in results]
        self.assertIn(self.notif1.id, ids)
        self.assertIn(self.notif2.id, ids)
        self.assertNotIn(self.notif_other.id, ids)

    def test_unread_notification_count(self):
        """Lấy chính xác số lượng thông báo chưa đọc của user."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('unread_count'), 2)

        # Đánh dấu 1 thông báo đã đọc
        self.notif1.is_read = True
        self.notif1.save(update_fields=['is_read'])

        response2 = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response2.data.get('unread_count'), 1)

    def test_mark_single_notification_read(self):
        """Đánh dấu 1 thông báo cụ thể là đã đọc thành công."""
        self.client.force_authenticate(user=self.user1)
        url = f'/api/notifications/{self.notif1.id}/read/'

        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('is_read'))

        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

    def test_mark_all_notifications_read(self):
        """Đánh dấu tất cả thông báo của user thành đã đọc."""
        self.client.force_authenticate(user=self.user1)
        url = '/api/notifications/mark-all-read/'

        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.is_read)
        self.assertTrue(self.notif2.is_read)

        # Thông báo của user 2 không bị ảnh hưởng
        self.notif_other.refresh_from_db()
        self.assertFalse(self.notif_other.is_read)

    def test_cross_user_notification_access_idor(self):
        """User 1 không thể đánh dấu đọc hoặc truy cập thông báo của User 2 (chống IDOR -> 404)."""
        self.client.force_authenticate(user=self.user1)
        url = f'/api/notifications/{self.notif_other.id}/read/'

        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.notif_other.refresh_from_db()
        self.assertFalse(self.notif_other.is_read)

    def test_anonymous_notification_access_blocked(self):
        """Người dùng chưa đăng nhập gọi API thông báo bị chặn 401."""
        endpoints = [
            ('GET', '/api/notifications/'),
            ('GET', '/api/notifications/unread-count/'),
            ('PATCH', f'/api/notifications/{self.notif1.id}/read/'),
            ('PATCH', '/api/notifications/mark-all-read/'),
        ]
        for method, url in endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    res = self.client.get(url)
                else:
                    res = self.client.patch(url)
                self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
