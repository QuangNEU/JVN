from django.db import models
from accounts.models import Account, Company
from jobs.models import JobPost
# Create your models here.
class Report(models.Model):
    class TargetType(models.TextChoices):
        JOB_POST = 'JOB_POST'
        COMPANY = 'COMPANY'
    class Status(models.TextChoices):
        PENDING = 'PENDING'
        RESOLVED = 'RESOLVED'
        DISMISSED = 'DISMISSED'

    reporter = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='report_made')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null= True, blank= True)
    job_post = models.ForeignKey(JobPost, on_delete=models.SET_NULL,null=True, blank= True )
    target_type = models.CharField(max_length=20, choices= TargetType.choices)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices= Status.choices, default=Status.PENDING)
    admin_note = models.TextField(null=True, blank= True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank= True)

    class Meta:
        indexes = [models.Index(fields=['target_type', 'status'])]
        constraints = [
            models.UniqueConstraint(
                fields=['reporter', 'job_post'],
                condition=models.Q(target_type='JOB_POST'),
                name='unique_reporter_jobpost_report'
            ),
            models.UniqueConstraint(
                fields=['reporter', 'company'],
                condition=models.Q(target_type='COMPANY'),
                name='unique_reporter_company_report'
            ),
        ]
    def __str__(self):
        return f'{self.reporter.name} report {self.job_post or self.company}'