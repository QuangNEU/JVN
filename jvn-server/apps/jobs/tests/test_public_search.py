from datetime import timedelta
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Account
from applications.models import Application
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
    make_cv,
    make_job,
    make_seeker,
)
from jobs.models import JobPost


@override_settings(CACHES=TEST_CACHES_SETTING)
class PublicSearchAndStatusTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo Company và các tin tuyển dụng
        self.comp_acc1 = make_account(role=Account.ROLE_CHOICES.COMPANY, name="Tiki Tech Corp", email="tiki_srch@example.com")
        self.company1 = make_company(account=self.comp_acc1, verification_level=2)

        self.comp_acc2 = make_account(role=Account.ROLE_CHOICES.COMPANY, name="Shopee Vietnam", email="shopee_srch@example.com")
        self.company2 = make_company(account=self.comp_acc2, verification_level=2)

        # Tin 1: PUBLISHED, còn hạn, hợp lệ
        self.job_pub = make_job(
            company=self.company1,
            title="Senior ReactJS Developer",
            status="PUBLISHED",
            expiration_date=timezone.localdate() + timedelta(days=20),
            salary_min=15000000,
            salary_max=30000000,
        )

        # Tin 2: PUBLISHED, liên quan Python
        self.job_python = make_job(
            company=self.company2,
            title="Senior Python Backend Developer",
            status="PUBLISHED",
            expiration_date=timezone.localdate() + timedelta(days=20),
            salary_min=25000000,
            salary_max=45000000,
        )

        # Tin 3: PENDING (chưa duyệt) -> không được hiển thị công khai
        self.job_pending = make_job(
            company=self.company1,
            title="Secret Pending Position",
            status="PENDING",
        )

        # Tin 4: Đã hết hạn -> không được hiển thị công khai
        self.job_expired = make_job(
            company=self.company1,
            title="Old Expired Position",
            status="PUBLISHED",
            expiration_date=timezone.localdate() - timedelta(days=5),
        )

        # Seeker để test check applied
        self.seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER, email="seeker_srch@example.com")
        self.seeker = make_seeker(account=self.seeker_account)
        self.cv = make_cv(seeker=self.seeker)

        # Seeker đã nộp vào job_pub
        self.app = Application.objects.create(
            applicant=self.seeker,
            job_post=self.job_pub,
            cv=self.cv,
            status=Application.Status.SENT,
        )

    def test_public_jobposts_search_filters(self):
        """Khách vãng lai tìm kiếm việc làm công khai theo từ khóa, mức lương."""
        url = '/api/jobs/jobposts/public/'

        # 1. Tìm theo từ khóa "ReactJS"
        res_kw = self.client.get(url, {'keyword': 'ReactJS'})
        self.assertEqual(res_kw.status_code, status.HTTP_200_OK)
        titles = [j['title'] for j in res_kw.data.get('results', [])]
        self.assertIn("Senior ReactJS Developer", titles)
        self.assertNotIn("Senior Python Backend Developer", titles)

        # 2. Tìm theo từ khóa tên công ty "Shopee"
        res_comp = self.client.get(url, {'keyword': 'Shopee'})
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        titles_comp = [j['title'] for j in res_comp.data.get('results', [])]
        self.assertIn("Senior Python Backend Developer", titles_comp)

        # 3. Lọc theo salary_min >= 20.000.000
        res_salary = self.client.get(url, {'salary_min': 20000000})
        self.assertEqual(res_salary.status_code, status.HTTP_200_OK)
        ids_salary = [j['id'] for j in res_salary.data.get('results', [])]
        self.assertIn(self.job_python.id, ids_salary)

    def test_public_jobposts_excludes_unapproved_or_expired(self):
        """API tìm kiếm công khai tuyệt đối không hiển thị tin PENDING hoặc tin đã hết hạn."""
        url = '/api/jobs/jobposts/public/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ids = [j['id'] for j in response.data.get('results', [])]
        self.assertIn(self.job_pub.id, ids)
        self.assertIn(self.job_python.id, ids)
        self.assertNotIn(self.job_pending.id, ids)
        self.assertNotIn(self.job_expired.id, ids)

    def test_public_company_search_and_detail(self):
        """Khách vãng lai tìm kiếm công ty và xem chi tiết công ty công khai."""
        # 1. Tìm kiếm công ty theo tên
        search_res = self.client.get('/api/companies/search/', {'keyword': 'Tiki'})
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in search_res.data.get('results', [])]
        self.assertIn("Tiki Tech Corp", names)

        # 2. Xem chi tiết công ty
        detail_res = self.client.get(f'/api/companies/{self.company1.account_id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data.get('name'), "Tiki Tech Corp")

        # 3. Xem danh sách công ty nổi bật (featured)
        featured_res = self.client.get('/api/companies/featured/')
        self.assertEqual(featured_res.status_code, status.HTTP_200_OK)

    def test_check_applied_and_bulk_check_applied(self):
        """Kiểm tra trạng thái đã nộp đơn đơn lẻ và hàng loạt cho ứng viên."""
        self.client.force_authenticate(user=self.seeker_account)

        # 1. Check applied đơn lẻ: job_pub -> True, job_python -> False
        res1 = self.client.get(f'/api/applications/check-applied/{self.job_pub.id}/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data.get('is_applied'))

        res2 = self.client.get(f'/api/applications/check-applied/{self.job_python.id}/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data.get('is_applied'))

        # 2. Bulk check applied: gửi cả 2 id -> chỉ trả về id của job_pub
        url_bulk = f'/api/applications/check-applied/bulk/?job_post_ids={self.job_pub.id}&job_post_ids={self.job_python.id}'
        res_bulk = self.client.get(url_bulk)
        self.assertEqual(res_bulk.status_code, status.HTTP_200_OK)
        applied_ids = res_bulk.data.get('applied_job_ids', [])
        self.assertIn(self.job_pub.id, applied_ids)
        self.assertNotIn(self.job_python.id, applied_ids)
