from django.db import models
from django.contrib.auth.models import AbstractUser,BaseUserManager
from core.constants import HEADCOUNT_CHOICES
# Create your models here.

class AccountManager(BaseUserManager):
    def create_user(self, email, password = None, **extra_fields):
        if not email:
            raise ValueError("Ten dang nhap phai la email")
        email = self.normalize_email(email)
        user = self.model(email = email,**extra_fields)
        user.set_password(password)
        user.save(using = self._db)
        return user
    def create_superuser(self,email,password=None, **extra_fields):
        user = self.create_user(
            email,
            password,
        )
        user.is_staff = True
        user.is_superuser = True
        user.role = "ADMIN"
        user.save(using = self._db)
        return user
    
class Account(AbstractUser):
    class ROLE_CHOICES(models.TextChoices):
        ADMIN = "ADMIN","Quan tri vien",
        SEEKER = "SEEKER","Nguoi tim viec",
        COMPANY = "COMPANY","Nha tuyen dung",
    
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20,choices=ROLE_CHOICES)
    tel = models.CharField(max_length = 15,null=True, blank=True)
    name = models.CharField(max_length= 255)
    email_verified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default= False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = AccountManager()

    def __str__(self):
        return f"{self.email}-{self.role}"

class AccountLockHistory(models.Model):
    class Action(models.TextChoices):
        LOCKED = 'LOCKED', 'Đã khoá'
        UNLOCKED = 'UNLOCKED', 'Đã mở khoá'
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='lock_history')
    action = models.CharField(max_length=20, choices= Action.choices)
    reason = models.CharField(blank= True)
    performed_by = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)


class JobSeeker(models.Model):
    account = models.OneToOneField(Account, on_delete=models.CASCADE,primary_key=True)
    github_urls = models.CharField(max_length=100,blank=True,null=True)
    def __str__(self):
        return self.account.name
    
class Company(models.Model):
    class CertStatus(models.TextChoices):
        NOT_SUBMITTED = 'NOT_SUBMITTED', 'Chưa nộp'
        PENDING = 'PENDING', 'Đang chờ duyệt'
        APPROVED = 'APPROVED', 'Đã duyệt'
        REJECTED = 'REJECTED', 'Bị từ chối'
    account = models.OneToOneField(Account, on_delete=models.CASCADE, primary_key=True)
    description = models.TextField(blank=True, null=True)
    headcount = models.CharField(max_length=20, choices=HEADCOUNT_CHOICES, blank=True, null=True)
    province = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    exact_address = models.CharField(max_length=255, blank=True, null=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    founded_date = models.DateField(null=True, blank=True)
    tax_code = models.CharField(max_length=20, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    business_cert_document = models.FileField(upload_to='business_certs/', null=True, blank=True)
    business_cert_status = models.CharField(max_length=20, choices=CertStatus.choices, default=CertStatus.NOT_SUBMITTED)
    business_cert_rejected_reason = models.CharField(max_length=255, null=True, blank=True)
    business_cert_reviewed_at = models.DateTimeField(null=True, blank=True)
    is_promoted = models.BooleanField(default=False)
    def __str__(self):
        return self.account.name

class Follow(models.Model):
    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE,related_name='following')
    company = models.ForeignKey(Company,on_delete=models.CASCADE,related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('job_seeker', 'company')

    def __str__(self):
        return f"{self.job_seeker} follows {self.company}"
