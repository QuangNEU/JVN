from accounts.models import Account
from core.permission import have_role
from .models import Report


def get_admin_report_selector(*, user: Account = None, status_filter=None):
    if user is not None:
        have_role(user=user, role=Account.ROLE_CHOICES.ADMIN)
    queryset = Report.objects.select_related('reporter', 'job_post', 'company__account').order_by('-created_at')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    return queryset

