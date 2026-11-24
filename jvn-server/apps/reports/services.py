from accounts.models import Account, Company
from jobs.models import JobPost
from .models import Report
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.db import transaction

def create_report_services(*,user: Account, target_id, target_type: str, reason):
    if user.role != Account.ROLE_CHOICES.SEEKER:
        raise PermissionDenied({'detail': 'You dont have the permission to report this id'})
    
    kwargs = {'reporter': user, 'target_type': target_type, 'reason': reason}
    if target_type == Report.TargetType.JOB_POST:
        job_post = get_object_or_404(JobPost, pk=target_id, is_deleted=False)
        if Report.objects.filter(reporter=user, target_type=target_type, job_post=job_post).exists():
            raise ValidationError({'detail': 'You have report this post'})
        kwargs['job_post'] = job_post
    elif target_type == Report.TargetType.COMPANY:
        company = get_object_or_404(Company, pk=target_id)
        if Report.objects.filter(reporter=user, target_type=target_type, company=company).exists():
            raise ValidationError({'detail': 'You have report this company.'})
        kwargs['company'] = company
    else:
        ValidationError({'detail': 'target type not valid'})
    report = Report.objects.create(**kwargs)
    return report

def _get_related_target_filter(report: Report) -> Q:
    if report.target_type == Report.TargetType.JOB_POST:
        return Q(target_type=Report.TargetType.JOB_POST, job_post=report.job_post)
    return Q(target_type=Report.TargetType.COMPANY, company=report.company)


@transaction.atomic
def _finalize_report_service(*, admin_user, report_id: int, new_status: str, admin_note: str, cascade_note: str):
    if admin_user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'You dont have the permission'})
    report = get_object_or_404(Report.objects.select_for_update(), pk=report_id, status=Report.Status.PENDING)

    target_filter = _get_related_target_filter(report)
    Report.objects.filter(target_filter, status=Report.Status.PENDING).exclude(pk=report.pk).update(
        status=new_status, admin_note=cascade_note, reviewed_at=timezone.now(),
    )
    report.status = new_status
    report.admin_note = admin_note
    report.reviewed_at = timezone.now()
    report.save(update_fields=['status', 'admin_note', 'reviewed_at'])
    report.refresh_from_db()
    return report


def resolve_report_service(*, admin_user, report_id: int, admin_note: str | None = None):
    return _finalize_report_service(
        admin_user=admin_user, report_id=report_id, new_status=Report.Status.RESOLVED,
        admin_note=admin_note, cascade_note='Tự động xử lý theo báo cáo trùng lặp đã được duyệt.',
    )


def dismiss_report_service(*, admin_user, report_id: int, admin_note: str):
    return _finalize_report_service(
        admin_user=admin_user, report_id=report_id, new_status=Report.Status.DISMISSED,
        admin_note=admin_note, cascade_note='Tự động bỏ qua theo báo cáo trùng lặp đã được xử lý.',
    )