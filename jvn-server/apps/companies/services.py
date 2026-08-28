from accounts.services import AccountLockHistory
from accounts.models import Account
from jobs.models import JobPost
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from notifications.services import create_notification_service
def lock_company_service(*, admin_user: Account, target_account_id: int, reason: str):
    if admin_user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'You dont have the permission'})

    target = get_object_or_404(Account, pk=target_account_id, role=Account.ROLE_CHOICES.COMPANY)
    if target.is_locked:
        raise ValidationError({'detail': 'Tài khoản này đã bị khóa từ trước.'})

    target.is_locked = True
    target.save(update_fields=['is_locked'])

    AccountLockHistory.objects.create(
        account=target, action=AccountLockHistory.Action.LOCKED, reason=reason, performed_by=admin_user,
    )
    JobPost.objects.filter(company=target.company, status=JobPost.STATUS.PUBLISH).update(is_hidden_by_lock=True)

    create_notification_service(
        user=target, message=f"Tài khoản của bạn đã bị khóa: {reason}", link='/support', send_email=True,
    )
    return target


def unlock_company_service(*, admin_user: Account, target_account_id: int):
    if admin_user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionDenied({'detail': 'You dont have the permission'})

    target = get_object_or_404(Account, pk=target_account_id, role=Account.ROLE_CHOICES.COMPANY, is_locked=True)
    target.is_locked = False
    target.save(update_fields=['is_locked'])

    AccountLockHistory.objects.create(
        account=target, action=AccountLockHistory.Action.UNLOCKED, reason='', performed_by=admin_user,
    )
    JobPost.objects.filter(company=target.company, is_hidden_by_lock=True).update(is_hidden_by_lock=False)
    return target