from datetime import timedelta
from unittest.mock import patch
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
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


@override_settings(CACHES=TEST_CACHES_SETTING)
class ApplyJobTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('celery.app.task.Task.delay')
    def test_seeker_apply_success(self, mock_delay):
        """A1: Seeker ứng tuyển thành công với CV của mình vào tin đang tuyển."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker = make_seeker(seeker_account)
        company = make_company()
        job = make_job(company=company, status="PUBLISHED")
        cv = make_cv(seeker=seeker)

        self.client.force_authenticate(user=seeker_account)
        url = reverse('apply_job', kwargs={'job_post_id': job.id})
        data = {
            'cv_id': cv.id,
            'cover_letter': 'Tôi rất quan tâm và muốn ứng tuyển vị trí này.',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Application.objects.filter(applicant=seeker, job_post=job).exists())

        application = Application.objects.get(applicant=seeker, job_post=job)
        self.assertEqual(application.status, Application.Status.SENT)
        self.assertEqual(application.cv_id, cv.id)
        self.assertEqual(application.cover_letter, 'Tôi rất quan tâm và muốn ứng tuyển vị trí này.')

    # BUG: apply_job_services không kiểm tra job_post.expiration_date trước khi cho ứng tuyển.
    # Tin hết hạn (expiration_date trong quá khứ) nhưng status vẫn là PUBLISHED vẫn được tạo Application thành công.
    @patch('celery.app.task.Task.delay')
    def test_apply_expired_job_rejected(self, mock_delay):
        """A2: Ứng tuyển vào tin đã hết hạn phải bị từ chối, không tạo Application."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker = make_seeker(seeker_account)
        company = make_company()
        yesterday = timezone.localdate() - timedelta(days=1)
        job = make_job(company=company, status="PUBLISHED", expiration_date=yesterday)
        cv = make_cv(seeker=seeker)

        self.client.force_authenticate(user=seeker_account)
        url = reverse('apply_job', kwargs={'job_post_id': job.id})
        data = {
            'cv_id': cv.id,
            'cover_letter': 'Ứng tuyển job đã hết hạn.',
        }

        response = self.client.post(url, data, format='json')

        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Application.objects.filter(applicant=seeker, job_post=job).exists())

    # BUG: apply_job_services dùng get_object_or_404(JobPost, pk=job_post_id) không lọc is_deleted=False.
    # Nếu tin bị xóa mềm (is_deleted=True) nhưng status là PUBLISHED thì vẫn cho ứng tuyển.
    @patch('celery.app.task.Task.delay')
    def test_apply_soft_deleted_job_rejected(self, mock_delay):
        """A3: Ứng tuyển vào tin đã bị xóa mềm phải bị từ chối, không tạo Application."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker = make_seeker(seeker_account)
        company = make_company()
        job = make_job(company=company, status="PUBLISHED", is_deleted=True)
        cv = make_cv(seeker=seeker)

        self.client.force_authenticate(user=seeker_account)
        url = reverse('apply_job', kwargs={'job_post_id': job.id})
        data = {
            'cv_id': cv.id,
            'cover_letter': 'Ứng tuyển job đã bị xóa mềm.',
        }

        response = self.client.post(url, data, format='json')

        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Application.objects.filter(applicant=seeker, job_post=job).exists())

    # BUG: apply_job_services và ApplyJobCreateSerializer không xác thực quyền sở hữu CV (cv.job_seeker == applicant).
    # Seeker có thể truyền cv_id của người khác vào payload và tạo Application thành công.
    @patch('celery.app.task.Task.delay')
    def test_apply_with_other_seeker_cv_rejected(self, mock_delay):
        """A4: Dùng CV của người khác để ứng tuyển phải bị từ chối, không tạo Application."""
        seeker1_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker1 = make_seeker(seeker1_account)

        seeker2_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker2 = make_seeker(seeker2_account)
        other_cv = make_cv(seeker=seeker2)

        company = make_company()
        job = make_job(company=company, status="PUBLISHED")

        self.client.force_authenticate(user=seeker1_account)
        url = reverse('apply_job', kwargs={'job_post_id': job.id})
        data = {
            'cv_id': other_cv.id,
            'cover_letter': 'Ứng tuyển bằng CV của seeker khác.',
        }

        response = self.client.post(url, data, format='json')

        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Application.objects.filter(applicant=seeker1, job_post=job).exists())

    @patch('celery.app.task.Task.delay')
    def test_duplicate_apply_blocked(self, mock_delay):
        """A5: Ứng tuyển trùng lặp vào cùng 1 tin phải bị chặn, vẫn chỉ có 1 Application."""
        seeker_account = make_account(role=Account.ROLE_CHOICES.SEEKER)
        seeker = make_seeker(seeker_account)
        company = make_company()
        job = make_job(company=company, status="PUBLISHED")
        cv = make_cv(seeker=seeker)

        self.client.force_authenticate(user=seeker_account)
        url = reverse('apply_job', kwargs={'job_post_id': job.id})
        data = {
            'cv_id': cv.id,
            'cover_letter': 'Lần nộp 1.',
        }

        # Lần 1: Thành công
        response1 = self.client.post(url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.filter(applicant=seeker, job_post=job).count(), 1)

        # Lần 2: Bị chặn (400 Bad Request do ValidationError)
        data['cover_letter'] = 'Lần nộp 2.'
        response2 = self.client.post(url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

        # Vẫn chỉ có 1 Application trong DB
        self.assertEqual(Application.objects.filter(applicant=seeker, job_post=job).count(), 1)
