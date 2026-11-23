import uuid
from datetime import timedelta
from django.utils import timezone
from accounts.models import Account, Company, JobSeeker
from jobs.models import JobPost
from resumes.models import CV

TEST_CACHES_SETTING = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-cache',
    }
}


def make_account(
    role=Account.ROLE_CHOICES.SEEKER,
    email=None,
    name=None,
    password="password123",
    email_verified=True,
    is_locked=False,
    **kwargs
) -> Account:
    """Tạo Account theo role."""
    if email is None:
        email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    if name is None:
        name = f"User {email.split('@')[0]}"

    account = Account.objects.create_user(
        email=email,
        password=password,
        role=role,
        name=name,
        email_verified=email_verified,
        is_locked=is_locked,
        **kwargs
    )
    return account


def make_seeker(account=None, **kwargs) -> JobSeeker:
    """Tạo hoặc lấy JobSeeker thuộc account."""
    if account is None:
        account = make_account(role=Account.ROLE_CHOICES.SEEKER)
    seeker, _ = JobSeeker.objects.get_or_create(account=account, defaults=kwargs)
    return seeker


def make_company(account=None, verification_level=2, **kwargs) -> Company:
    """
    Tạo hoặc lấy Company thuộc account với verification_level:
    - level 0: email_verified=False, cert_status=NOT_SUBMITTED
    - level 1: email_verified=True, cert_status=PENDING
    - level 2: email_verified=True, cert_status=APPROVED
    """
    if account is None:
        account = make_account(
            role=Account.ROLE_CHOICES.COMPANY,
            email_verified=(verification_level >= 1)
        )
    else:
        should_verify = verification_level >= 1
        if account.email_verified != should_verify:
            account.email_verified = should_verify
            account.save(update_fields=['email_verified'])

    if verification_level >= 2:
        cert_status = Company.CertStatus.APPROVED
    elif verification_level == 1:
        cert_status = Company.CertStatus.PENDING
    else:
        cert_status = Company.CertStatus.NOT_SUBMITTED

    defaults = {
        'province': 'Ha Noi',
        'ward': 'Cau Giay',
        'exact_address': '123 Duy Tan',
        'business_cert_status': cert_status,
        'description': 'Cong ty cong nghe hang dau Viet Nam',
        'headcount': '50-100',
    }
    defaults.update(kwargs)

    company, created = Company.objects.get_or_create(account=account, defaults=defaults)
    if not created:
        for key, value in defaults.items():
            setattr(company, key, value)
        company.save()
    return company


def make_job(company=None, status="PUBLISHED", **kwargs) -> JobPost:
    """Tạo JobPost cho company."""
    if company is None:
        company = make_company(verification_level=2)

    today = timezone.localdate()
    defaults = {
        'title': 'Senior Python Backend Developer',
        'descriptions': 'Chung toi can tuyen dung ky su lap trinh vien Python Django voi tren 2 nam kinh nghiem thuc chien.',
        'requirement': 'Thanh thao Python 3, Django, Django REST Framework, PostgreSQL va Docker.',
        'benefit': 'Muc luong canh tranh, thuong thang 13, bao hiem day du, che do du lich hang nam.',
        'type': JobPost.TYPE.FULLTIME,
        'status': status,
        'level': 'JUNIOR',
        'experience_requirement': '2 năm',
        'headcount': 2,
        'salary_min': 15000000,
        'salary_max': 30000000,
        'currency': 'VND',
        'expiration_date': today + timedelta(days=30),
        'is_deleted': False,
    }
    defaults.update(kwargs)
    return JobPost.objects.create(company=company, **defaults)


def make_cv(seeker=None, **kwargs) -> CV:
    """Tạo CV thuộc về JobSeeker."""
    if seeker is None:
        seeker = make_seeker()
    elif isinstance(seeker, Account):
        seeker = make_seeker(seeker)

    defaults = {
        'title': 'CV Python Developer',
        'file': 'cvs/test_cv.pdf',
        'level': 'JUNIOR',
        'is_default': True,
        'is_public': True,
    }
    defaults.update(kwargs)
    return CV.objects.create(job_seeker=seeker, **defaults)
