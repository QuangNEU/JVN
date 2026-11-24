from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from accounts.models import Account, Company
from accounts.selectors import get_company_verification_level
from applications.tests.utils import (
    TEST_CACHES_SETTING,
    make_account,
    make_company,
)
from jobs.models import Category, JobPost
from jobs.selectors import get_valid_leaf_categories


def _make_valid_job_payload(category_ids=None):
    payload = {
        'title': 'Senior Python Backend Developer',
        'descriptions': 'Chúng tôi đang tìm kiếm kỹ sư lập trình Backend Python với hơn 2 năm kinh nghiệm làm việc với Django REST Framework.',
        'requirement': 'Thành thạo Python 3, Django REST Framework, PostgreSQL, Docker và caching với Redis.',
        'benefit': 'Lương tháng 13, thưởng hiệu suất công việc, bảo hiểm đầy đủ theo quy định của nhà nước.',
        'type': 'FULLTIME',
        'level': 'SENIOR',
        'experience_requirement': '2 năm',
        'headcount': 2,
        'salary_min': 20000000,
        'salary_max': 35000000,
        'currency': 'VND',
        'is_negotiable': False,
    }
    if category_ids is not None:
        payload['category_ids'] = category_ids
    return payload


@override_settings(CACHES=TEST_CACHES_SETTING)
class CategoryAndVerificationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Tạo công ty theo các cấp độ xác thực
        self.company_lvl0 = make_company(verification_level=0)  # email_verified=False
        self.company_lvl1 = make_company(verification_level=1)  # email_verified=True, cert=PENDING
        self.company_lvl2 = make_company(verification_level=2)  # email_verified=True, cert=APPROVED

        # Tạo tài khoản admin
        self.admin_account = make_account(role=Account.ROLE_CHOICES.ADMIN, email="admin_cat@example.com")

    @patch('celery.app.task.Task.delay')
    def test_unverified_company_cannot_create_job(self, mock_delay):
        """G1: Công ty có cấp xác thực < 2 bị chặn 403 khi tạo JobPost."""
        url = '/api/jobs/jobposts/'
        payload = _make_valid_job_payload()

        # 1. Company Level 0 (chưa xác thực email) -> 403
        self.client.force_authenticate(user=self.company_lvl0.account)
        res_lvl0 = self.client.post(url, payload, format='json')
        self.assertEqual(res_lvl0.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(JobPost.objects.filter(company=self.company_lvl0).count(), 0)

        # 2. Company Level 1 (đã xác thực email, chưa duyệt GPKD) -> 403
        self.client.force_authenticate(user=self.company_lvl1.account)
        res_lvl1 = self.client.post(url, payload, format='json')
        self.assertEqual(res_lvl1.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(JobPost.objects.filter(company=self.company_lvl1).count(), 0)

        # 3. Company Level 2 (đầy đủ xác thực) -> 201 Thành công
        self.client.force_authenticate(user=self.company_lvl2.account)
        res_lvl2 = self.client.post(url, payload, format='json')
        self.assertEqual(res_lvl2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobPost.objects.filter(company=self.company_lvl2).count(), 1)

    def test_unverified_company_cannot_create_category(self):
        """G2: Công ty có cấp xác thực < 2 bị chặn 403 khi tạo Category."""
        url = '/api/jobs/category/create/'

        # 1. Company Level 0 -> 403
        self.client.force_authenticate(user=self.company_lvl0.account)
        res_lvl0 = self.client.post(url, {'title': 'Category Lvl 0'}, format='json')
        self.assertEqual(res_lvl0.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Category.objects.filter(title='Category Lvl 0').exists())

        # 2. Company Level 1 -> 403
        self.client.force_authenticate(user=self.company_lvl1.account)
        res_lvl1 = self.client.post(url, {'title': 'Category Lvl 1'}, format='json')
        self.assertEqual(res_lvl1.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Category.objects.filter(title='Category Lvl 1').exists())

        # 3. Company Level 2 -> 201 Created (trạng thái PENDING, chờ Admin duyệt)
        self.client.force_authenticate(user=self.company_lvl2.account)
        res_lvl2 = self.client.post(url, {'title': 'DevOps Engineering'}, format='json')
        self.assertEqual(res_lvl2.status_code, status.HTTP_201_CREATED)

        category = Category.objects.get(title='DevOps Engineering')
        self.assertEqual(category.status, Category.Status.PENDING)
        self.assertEqual(category.created_by, self.company_lvl2.account)
        self.assertIsNone(category.parent)

    def test_admin_create_category_approved(self):
        """G3: Admin tạo category thì status tự động là APPROVED ngay lập tức."""
        url = '/api/jobs/category/create/'
        self.client.force_authenticate(user=self.admin_account)

        response = self.client.post(url, {'title': 'Công nghệ thông tin'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        category = Category.objects.get(title='Công nghệ thông tin')
        self.assertEqual(category.status, Category.Status.APPROVED)
        self.assertEqual(category.created_by, self.admin_account)
        self.assertIsNone(category.parent)

    def test_category_max_two_levels(self):
        """G4: Hệ thống chỉ hỗ trợ 2 cấp danh mục, chặn tạo danh mục con cấp 3."""
        # Cấp 1 (Root): IT - Phần mềm (APPROVED)
        cat_lvl1 = Category.objects.create(
            title='IT - Phần mềm',
            status=Category.Status.APPROVED,
            parent=None
        )
        # Cấp 2 (Child): Lập trình Web (APPROVED, cha là cat_lvl1)
        cat_lvl2 = Category.objects.create(
            title='Lập trình Web',
            status=Category.Status.APPROVED,
            parent=cat_lvl1
        )

        url = '/api/jobs/category/create/'
        self.client.force_authenticate(user=self.admin_account)

        # 1. Cố tình tạo danh mục cấp 3 (cha là cat_lvl2) -> Bị chặn 400 Bad Request
        res_lvl3 = self.client.post(
            url,
            {'title': 'ReactJS Frontend', 'parent_id': cat_lvl2.id},
            format='json'
        )
        self.assertEqual(res_lvl3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('2 cấp', str(res_lvl3.data))
        self.assertFalse(Category.objects.filter(parent=cat_lvl2).exists())

        # 2. Tạo danh mục cấp 2 hợp lệ (cha là cat_lvl1) -> Thành công 201 Created
        res_valid_lvl2 = self.client.post(
            url,
            {'title': 'Lập trình Mobile', 'parent_id': cat_lvl1.id},
            format='json'
        )
        self.assertEqual(res_valid_lvl2.status_code, status.HTTP_201_CREATED)
        cat_created = Category.objects.get(title='Lập trình Mobile')
        self.assertEqual(cat_created.parent, cat_lvl1)

    @patch('celery.app.task.Task.delay')
    def test_job_cannot_assign_non_leaf_category(self, mock_delay):
        """G5: Tin tuyển dụng không được gán danh mục cha (non-leaf) hoặc danh mục chưa duyệt."""
        # Danh mục nhóm (cấp 1 có con cấp 2 đã duyệt)
        parent_group = Category.objects.create(
            title='Kỹ thuật phần mềm',
            status=Category.Status.APPROVED,
            parent=None
        )
        child_cat = Category.objects.create(
            title='Backend Developer',
            status=Category.Status.APPROVED,
            parent=parent_group
        )

        # Danh mục chưa duyệt (PENDING)
        pending_cat = Category.objects.create(
            title='Chưa duyệt',
            status=Category.Status.PENDING,
            parent=None
        )

        url = '/api/jobs/jobposts/'
        self.client.force_authenticate(user=self.company_lvl2.account)

        # 1. Gán danh mục cha (parent_group) -> 400 Bad Request
        payload_parent = _make_valid_job_payload(category_ids=[parent_group.id])
        res_parent = self.client.post(url, payload_parent, format='json')
        self.assertEqual(res_parent.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category nhóm', str(res_parent.data))
        self.assertEqual(JobPost.objects.filter(company=self.company_lvl2).count(), 0)

        # 2. Gán danh mục chưa duyệt (pending_cat) -> 400 Bad Request
        payload_pending = _make_valid_job_payload(category_ids=[pending_cat.id])
        res_pending = self.client.post(url, payload_pending, format='json')
        self.assertEqual(res_pending.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(JobPost.objects.filter(company=self.company_lvl2).count(), 0)

    @patch('celery.app.task.Task.delay')
    def test_job_assign_valid_leaf_category_success(self, mock_delay):
        """G6: Gán danh mục lá hợp lệ (danh mục con hoặc danh mục gốc không có con) thành công."""
        parent_group = Category.objects.create(
            title='Công nghệ',
            status=Category.Status.APPROVED,
            parent=None
        )
        child_cat = Category.objects.create(
            title='Python Engineer',
            status=Category.Status.APPROVED,
            parent=parent_group
        )
        # Danh mục đứng độc lập (không có con) cũng là lá
        standalone_leaf = Category.objects.create(
            title='Thiết kế UI/UX',
            status=Category.Status.APPROVED,
            parent=None
        )

        url = '/api/jobs/jobposts/'
        self.client.force_authenticate(user=self.company_lvl2.account)

        payload = _make_valid_job_payload(category_ids=[child_cat.id, standalone_leaf.id])
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        job_post = JobPost.objects.get(id=response.data['id'])
        assigned_categories = set(job_post.category.all())
        self.assertIn(child_cat, assigned_categories)
        self.assertIn(standalone_leaf, assigned_categories)
        self.assertEqual(len(assigned_categories), 2)

    def test_verification_and_leaf_helper_unit(self):
        """Unit test kiểm thử độ bao phủ cho get_company_verification_level và get_valid_leaf_categories."""
        # 1. get_company_verification_level
        self.assertEqual(get_company_verification_level(company=self.company_lvl0), 0)
        self.assertEqual(get_company_verification_level(company=self.company_lvl1), 1)
        self.assertEqual(get_company_verification_level(company=self.company_lvl2), 2)

        # 2. get_valid_leaf_categories
        leaf1 = Category.objects.create(title='Leaf A', status=Category.Status.APPROVED)
        leaf2 = Category.objects.create(title='Leaf B', status=Category.Status.APPROVED)
        parent = Category.objects.create(title='Parent G', status=Category.Status.APPROVED)
        child = Category.objects.create(title='Child G', status=Category.Status.APPROVED, parent=parent)

        # Danh sách lá hợp lệ
        valid_leaves = get_valid_leaf_categories([leaf1.id, leaf2.id, child.id])
        self.assertEqual(valid_leaves.count(), 3)

        # Danh mục cha ném ValidationError
        with self.assertRaises(ValidationError):
            get_valid_leaf_categories([parent.id])

        # Danh mục không tồn tại ném ValidationError
        with self.assertRaises(ValidationError):
            get_valid_leaf_categories([999999])
