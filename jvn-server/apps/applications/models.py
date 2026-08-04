from django.db import models

from jobs.models import JobPost
from resumes.models import CV
from accounts.models import JobSeeker

class Application(models.Model):

    class Status(models.TextChoices):
        SENT = "SENT", "Đã gửi"
        RECEIVED = "RECEIVED", "Đã nhận"
        WATCHED = "WATCHED", "Đã xem"
        SUITABLE = "SUITABLE", "NTD đánh giá phù hợp"
        REJECTED = "REJECTED", "Từ chối"
        INTERVIEWING = "INTERVIEWING", "Phỏng vấn"
        HIRED = "HIRED", "Đã trúng tuyển" 

    applicant = models.ForeignKey(
        JobSeeker,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    job_post = models.ForeignKey(
        JobPost,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    employer_notes = models.TextField(
        blank=True, 
        help_text="Ghi chú nội bộ của nhà tuyển dụng"
    )

    cv = models.ForeignKey(
        CV,
        on_delete=models.SET_NULL,
        null= True,
        related_name="applications"
    )

    date_applied = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(
        auto_now=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SENT
    )

    interview_date = models.DateTimeField(
        null=True,
        blank=True
    )
    rejected_reason = models.TextField(
        blank=True
    )
    cover_letter = models.TextField(blank=True, null=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["job_post", "applicant"],
                name="unique_application"
            )
        ]

        indexes = [
            models.Index(fields=["applicant"]),
            models.Index(fields=["job_post"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.applicant} -> {self.job_post.title}"