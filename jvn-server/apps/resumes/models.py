from django.db import models
from accounts.models import JobSeeker
# Create your models here.
class Tag(models.Model):
    tag_name = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.tag_name
    
class CV(models.Model):
    LEVEL_CHOICES=(
        ('INTERN','Intern'),
        ('FRESHER','Fresher'),
        ("JUNIOR", "Junior"),
        ("SENIOR", "Senior"),
    )
    job_seeker = models.ForeignKey(JobSeeker,on_delete=models.CASCADE,related_name='cvs')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='cvs/')
    level = models.CharField(max_length=20,choices=LEVEL_CHOICES)
    tags = models.ManyToManyField(Tag,related_name='cvs',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title