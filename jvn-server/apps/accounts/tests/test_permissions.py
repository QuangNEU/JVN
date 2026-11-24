from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIClient, APIRequestFactory

from django.contrib.auth.models import AnonymousUser
from accounts.models import Account, Company, JobSeeker
from core.permission import (
    IsAuthenticatedAndNotLocked,
    get_owned_or_403,
    have_role,
)
from jobs.models import JobPost
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_job,
    make_seeker,
)


@override_settings(CACHES=TEST_CACHES_SETTING)
class PermissionsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo sẵn các actor
        self.seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER, email="seeker_f@example.com")
        self.seeker = make_seeker(self.seeker_account)

        self.company_account1 = make_account(role=Account.ROLE_CHOICES.COMPANY, email="company1_f@example.com")
        self.company1 = make_company(account=self.company_account1, verification_level=2)

        self.company_account2 = make_account(role=Account.ROLE_CHOICES.COMPANY, email="company2_f@example.com")
        self.company2 = make_company(account=self.company_account2, verification_level=2)

        self.admin_account = make_account(role=Account.ROLE_CHOICES.ADMIN, email="admin_f@example.com")

        # Tạo job cho company1 và company2
        self.job1 = make_job(company=self.company1, status="PUBLISHED")
        self.job2 = make_job(company=self.company2, status="PUBLISHED")

    def test_anonymous_gets_401(self):
        """F1: Gọi endpoint bảo vệ khi chưa đăng nhập -> HTTP 401."""
        protected_endpoints = [
            ('GET', '/api/accounts/profile/'),
            ('POST', '/api/jobs/jobposts/'),
            ('GET', '/api/applications/me/application/'),
            ('GET', '/api/companies/dashboard-summary/'),
            ('GET', '/api/reports/admin/'),
            ('GET', '/api/accounts/admin-list/'),
        ]

        for method, url in protected_endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                else:
                    response = self.client.post(url, {}, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                    f"Anonymous calling {method} {url} should return 401 but got {response.status_code}"
                )

    def test_seeker_forbidden_on_company_endpoints(self):
        """F2: Seeker gọi endpoint của Company -> HTTP 403."""
        self.client.force_authenticate(user=self.seeker_account)

        valid_job_payload = {
            'title': 'Seeker Post Title',
            'descriptions': 'Chi tiết mô tả công việc tuyển dụng lập trình viên backend Python với kinh nghiệm Django.',
            'requirement': 'Kỹ năng Python, Django REST Framework, PostgreSQL.',
            'benefit': 'Lương tháng 13, bảo hiểm đầy đủ.',
            'type': 'FULLTIME',
            'level': 'SENIOR',
            'experience_requirement': '2 năm',
            'headcount': 2,
        }

        company_endpoints = [
            ('POST', '/api/jobs/jobposts/', valid_job_payload),
            ('GET', '/api/companies/dashboard-summary/', None),
            ('GET', f'/api/applications/job/{self.job1.id}/', None),
            ('GET', '/api/companies/application-status-breakdown/', None),
            ('GET', '/api/companies/jobs-pending-review/', None),
        ]

        for method, url, data in company_endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                else:
                    response = self.client.post(url, data or {}, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"Seeker calling {method} {url} should return 403 but got {response.status_code}: {response.data}"
                )

    def test_company_forbidden_on_seeker_endpoints(self):
        """F3: Company gọi endpoint của Seeker -> HTTP 403."""
        self.client.force_authenticate(user=self.company_account1)

        seeker_endpoints = [
            ('POST', f'/api/applications/apply/{self.job2.id}/', {'cv_id': 1}),
            ('GET', '/api/applications/me/application/', None),
            ('POST', f'/api/jobs/saved/{self.job2.id}/', None),
            ('GET', '/api/jobs/saved/', None),
            ('GET', '/api/accounts/follow/', None),
        ]

        for method, url, data in seeker_endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                else:
                    response = self.client.post(url, data or {}, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"Company calling {method} {url} should return 403 but got {response.status_code}: {response.data}"
                )

    @patch('celery.app.task.Task.delay')
    def test_non_admin_forbidden_on_admin_endpoints(self, mock_delay):
        """F4: Seeker/Company gọi endpoint của Admin -> HTTP 403; Admin gọi -> Thành công."""
        admin_endpoints = [
            ('GET', '/api/jobs/job-post/admin-review/', None),
            ('GET', '/api/accounts/admin-list/', None),
            ('GET', '/api/reports/admin/', None),
            ('GET', '/api/companies/system-overview/', None),
            ('GET', '/api/accounts/business-cert/', None),
            ('POST', f'/api/accounts/{self.seeker_account.id}/lock-seeker/', {'reason': 'Vi pham'}),
            ('POST', f'/api/companies/{self.company_account1.id}/lock-company/', {'reason': 'Vi pham'}),
        ]

        # 1. Seeker gọi endpoint admin -> 403
        self.client.force_authenticate(user=self.seeker_account)
        for method, url, data in admin_endpoints:
            with self.subTest(actor="Seeker", method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                else:
                    response = self.client.post(url, data or {}, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"Seeker calling Admin {method} {url} should return 403 but got {response.status_code}: {response.data}"
                )

        # 2. Company gọi endpoint admin -> 403
        self.client.force_authenticate(user=self.company_account1)
        for method, url, data in admin_endpoints:
            with self.subTest(actor="Company", method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                else:
                    response = self.client.post(url, data or {}, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"Company calling Admin {method} {url} should return 403 but got {response.status_code}: {response.data}"
                )

        # 3. Admin gọi endpoint admin -> 200
        self.client.force_authenticate(user=self.admin_account)
        for method, url, _ in admin_endpoints[:5]:
            with self.subTest(actor="Admin", method=method, url=url):
                response = self.client.get(url)
                self.assertEqual(
                    response.status_code,
                    status.HTTP_200_OK,
                    f"Admin calling {url} should return 200 but got {response.status_code}: {response.data}"
                )

    @patch('celery.app.task.Task.delay')
    def test_cross_company_access_forbidden_idor(self, mock_delay):
        """F5: Công ty A sửa/xóa tin của Công ty B -> HTTP 403 (chống IDOR)."""
        # Company 1 cố tình thao tác trên tin tuyển dụng của Company 2 (self.job2)
        self.client.force_authenticate(user=self.company_account1)
        url = f'/api/jobs/jobposts/{self.job2.id}/'

        # 1. Company 1 cố sửa tin của Company 2 (PATCH) -> 403 Forbidden
        patch_res = self.client.patch(url, {'title': 'Hacked Title By Other Company'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)
        self.job2.refresh_from_db()
        self.assertNotEqual(self.job2.title, 'Hacked Title By Other Company')
        self.assertEqual(self.job2.title, 'Senior Python Backend Developer')

        # 2. Company 1 cố xóa tin của Company 2 (DELETE) -> 403 Forbidden
        delete_res = self.client.delete(url)
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)
        self.job2.refresh_from_db()
        self.assertFalse(self.job2.is_deleted)

        # 3. Positive test: Company 2 tự sửa tin của chính mình -> 200 OK
        self.client.force_authenticate(user=self.company_account2)
        valid_res = self.client.patch(url, {'title': 'Updated Title Legitimate'}, format='json')
        self.assertEqual(valid_res.status_code, status.HTTP_200_OK)
        self.job2.refresh_from_db()
        self.assertEqual(self.job2.title, 'Updated Title Legitimate')

    def test_core_permission_helpers_unit(self):
        """F6: Unit test phủ 100% các branch của have_role, get_owned_or_403 và IsAuthenticatedAndNotLocked."""
        # --- 1. have_role unit test ---
        self.assertTrue(have_role(user=self.seeker_account, role='jobseeker'))
        self.assertTrue(have_role(user=self.company_account1, role='company'))
        self.assertTrue(have_role(user=self.admin_account, role=Account.ROLE_CHOICES.ADMIN))

        # Role không khớp -> PermissionDenied
        with self.assertRaises(PermissionDenied) as ctx:
            have_role(user=self.seeker_account, role='company')
        self.assertIn('Khong co quyen han', str(ctx.exception))

        with self.assertRaises(PermissionDenied) as ctx:
            have_role(user=self.company_account1, role=Account.ROLE_CHOICES.ADMIN)
        self.assertIn('Khong co quyen han', str(ctx.exception))

        # --- 2. get_owned_or_403 unit test ---
        # Nhánh 1: Thành công khi user sở hữu obj
        owned_obj = get_owned_or_403(
            user=self.company_account1,
            profile_attr='company',
            obj=self.job1,
            owner_field='company'
        )
        self.assertEqual(owned_obj, self.job1)

        # Nhánh 2: User không có profile_attr -> PermissionDenied ('Khong co quyen han')
        with self.assertRaises(PermissionDenied) as ctx:
            get_owned_or_403(
                user=self.seeker_account,
                profile_attr='company',  # seeker không có attribute 'company'
                obj=self.job1,
                owner_field='company'
            )
        self.assertIn('Khong co quyen han', str(ctx.exception))

        # Nhánh 3: Object không có owner_field -> PermissionDenied ('Khong co quyen truy cap')
        with self.assertRaises(PermissionDenied) as ctx:
            get_owned_or_403(
                user=self.company_account1,
                profile_attr='company',
                obj=self.seeker,  # seeker không có trường 'company'
                owner_field='company'
            )
        self.assertIn('Khong co quyen truy cap', str(ctx.exception))

        # Nhánh 4: actual_owner != expected_owner -> PermissionDenied ('Khong co quyen truy cap')
        with self.assertRaises(PermissionDenied) as ctx:
            get_owned_or_403(
                user=self.company_account1,
                profile_attr='company',
                obj=self.job2,  # job2 thuộc về company2
                owner_field='company'
            )
        self.assertIn('Khong co quyen truy cap', str(ctx.exception))

        # --- 3. IsAuthenticatedAndNotLocked unit test ---
        factory = APIRequestFactory()
        perm = IsAuthenticatedAndNotLocked()

        # Nhánh a: Chưa đăng nhập -> return False
        anon_request = factory.get('/')
        anon_request.user = AnonymousUser()
        self.assertFalse(perm.has_permission(anon_request, None))

        # Nhánh b: Đã đăng nhập nhưng bị khóa -> raise PermissionDenied code='account_locked'
        locked_user = make_account(is_locked=True)
        locked_request = factory.get('/')
        locked_request.user = locked_user
        with self.assertRaises(PermissionDenied) as ctx:
            perm.has_permission(locked_request, None)
        self.assertEqual(getattr(ctx.exception, 'detail', {}).get('code'), 'account_locked')

        # Nhánh c: Đã đăng nhập và không bị khóa -> return True
        valid_request = factory.get('/')
        valid_request.user = self.seeker_account
        self.assertTrue(perm.has_permission(valid_request, None))
