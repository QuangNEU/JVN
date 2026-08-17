from django.db import models
from accounts.models import Account,Company, JobSeeker
from resumes.models import CV,Tag
# Create your models here.
class Category(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Đang chờ duyệt'
        APPROVED = 'APPROVED', 'Đồng ý'
        REJECTED = 'REJECTED', 'Đã bị từ chối'
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50,choices=Status.choices,default='PENDING')
    created_by = models.ForeignKey(Account, on_delete=models.SET_NULL,null=True,related_name='created_category')
    rejected_reason = models.TextField(null=True, blank=True)
    parent = models.ForeignKey('self',on_delete=models.SET_NULL,null=True,blank=True,related_name='children')
    created_at =models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.title
    
class JobPost(models.Model):
    LEVEL_CHOICES = CV.LEVEL_CHOICES
    class STATUS(models.TextChoices):
        PUBLISH = "PUBLISHED","Dang mo",
        CLOSED = "CLOSED",'Da dong'
    
    class TYPE(models.TextChoices):
        FULLTIME = 'FULLTIME','Toan thoi gian',
        PARTTIME = 'PARTTIME','Ban thoi gian',
        HYBRID = 'HYBRID','Hon hop',
        REMOTE = 'REMOTE','Lam viec tu xa',
    
    title = models.CharField(max_length=200)
    descriptions = models.TextField()
    requirement = models.TextField()
    benefit = models.TextField(null=True,blank=True)
    type = models.CharField(max_length=50,choices=TYPE,default='FULLTIME')
    status = models.CharField(max_length=50,choices=STATUS)
    level = models.CharField(max_length=50,choices=LEVEL_CHOICES)
    experience_requirement = models.CharField(max_length=50)
    headcount = models.PositiveIntegerField(default=1)
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='VND')
    is_negotiable = models.BooleanField(default=False)
    date_posted = models.DateTimeField(null=True,blank=True)
    expiration_date = models.DateField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    company = models.ForeignKey(Company,on_delete=models.CASCADE,related_name='job_posts')
    tags = models.ManyToManyField(Tag,related_name='job_posts')
    category = models.ManyToManyField(Category,related_name='job_category')
    class Meta:
        ordering =['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_deleted']),
            models.Index(fields=['company']),
            models.Index(fields=['date_posted']),
        ]
    def __str__(self):
        return f"{self.title} - {self.company.account.name}"

class SavedJob(models.Model):
    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE, related_name='saved_jobs')
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_seeker', 'job_post')

    def __str__(self):
        return f"{self.job_seeker} saved {self.job_post}"