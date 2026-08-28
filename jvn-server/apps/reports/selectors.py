from .models import Report


def get_admin_report_selector(*, status_filter=None):
    queryset = Report.objects.select_related('reporter', 'job_post', 'company__account').order_by('-created_at')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    return queryset

