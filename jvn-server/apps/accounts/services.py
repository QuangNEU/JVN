import os
import uuid
from django.db import transaction,IntegrityError
from .models import Account,JobSeeker,Company,Follow
from .tasks import send_verification_email_task
from core.permission import have_role
from core.validator import validate_file
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.transport import requests as google_requests
from django.contrib.auth.tokens import default_token_generator
from google.oauth2 import id_token
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.utils.encoding import force_bytes,force_str
from django.utils import timezone
from django.conf import settings
from django.core.signing import TimestampSigner,BadSignature, SignatureExpired


ALLOWED_SEEKER_FIELDS = ['github_urls']
ALLOWED_COMPANY_FIELDS = ['name', 'description', 'headcount', 'province', 'ward', 'exact_address',
            'logo', 'website', 'founded_date', 'tax_code', 'industry', 'followers_count',]


def create_user_service(*,email,password,role,name,tel = None,province = None,ward = None, send_verification = True):
    try:
        with transaction.atomic():
            account = Account.objects.create_user(
                email=email,
                password= password,
                role = role,
                tel = tel,
                name = name
            )

            if role == Account.ROLE_CHOICES.SEEKER:
                JobSeeker.objects.create(account = account)
            elif role == Account.ROLE_CHOICES.COMPANY:
                Company.objects.create(account = account,province = province,ward = ward)     
            else:
                raise ValueError(f"Role khong hop le:{role}")  

            # if send_verification:
            #     transaction.on_commit(lambda: send_email_verification_service(user=account))  

            return account       
    except  IntegrityError:
        raise ValueError('Email da ton tai')

def login_service(*,email,password):
    account = authenticate(email = email,password = password)

    if not account:
        raise ValueError('Tai khoan khong ton tai')
    if not account.is_active:
        raise ValueError('Tai khoan da bi khoa')
    
    return account

@transaction.atomic
def update_my_detail_service(*, account: Account, data: dict):
    updated_field = []
    if 'tel' in data:
        account.tel = data.get('tel')
        updated_field.append('tel')
    if  'name' in data:
        account.name = data.get('name')
        updated_field.append('name')
    if updated_field:
        account.save(update_fields=updated_field)
    if account.role == Account.ROLE_CHOICES.SEEKER and hasattr(account, 'jobseeker'):
        seeker = account.jobseeker
        updated = False
        for field in ALLOWED_SEEKER_FIELDS:
            if field in data:
                setattr(seeker,field,data[field])
                updated = True
        if updated == True:
            seeker.save()
    elif account.role == Account.ROLE_CHOICES.COMPANY and hasattr(account,'company'):
        company = account.company
        updated = False
        for field in ALLOWED_COMPANY_FIELDS:
            if field in data:
                setattr(company,field,data[field])
                updated =True
        if updated == True:
            company.save()
    return account                           

def change_password(*, account :Account, data:dict):
    if not account.check_password(data.get('old_password')):
        raise ValidationError("Mat khau cu khong dung vui long nhap lai!")
    
    account.set_password(data.get('new_password'))
    account.save(update_fields=['password'])

    return account

def logout(*,data:dict):
    try:
        token = RefreshToken(data['refresh'])
        token.blacklist()
    except Exception:
        raise ValidationError({'refresh':'Token khong hop le'})    

@transaction.atomic    
def google_login_service(*, google_token:str,role:str):
    try:
        id_info = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            os.environ.get('GOOGLE_CLIENT_ID')
        )
    except ValueError:
        raise ValidationError('google token khong hop le')

    email = id_info.get('email')
    name = id_info.get('name')
    google_email_verified = id_info.get('email_verified', False)

    if not email:
        raise ValidationError('Khong lay duoc email tu tai khoan google nay')
    
    user = Account.objects.filter(email = email).first()

    if not user:
        if not role:
            raise ValidationError('Tai khoan chua ton tai vui long cap role')
        if role not in ('SEEKER', 'COMPANY'):
            raise ValidationError('Role khong hop le')
        default_province = ""
        default_ward = ""
        if role == Account.ROLE_CHOICES.COMPANY:
            default_province="Cap nhat sau"
            default_ward = "Cap nhat sau"
        
        random_password = uuid.uuid4().hex
        user = create_user_service(
            email=email,
            password=random_password,
            role=role,
            name=name,
            province=default_province,
            ward=default_ward,
            send_verification=False
        )

        user.set_unusable_password()
        if google_email_verified:                        
            user.email_verified = True
            user.save(update_fields=['password', 'email_verified'])
        else:
            user.save(update_fields=['password'])
    else:
        if not user.is_active:
            raise ValidationError('Tai khoan nay da bi khoa')
        if role and user.role != role:
            raise ValidationError('Tai khoan nay da duoc dung cho vai tro khac')   
        if google_email_verified and not user.email_verified:   
            user.email_verified = True
            user.save(update_fields=['email_verified'])
    refresh =RefreshToken.for_user(user)
    return{
        'refresh':str(refresh),
        'access':str(refresh.access_token),
        'name':user.name,
        'role':user.role
    } 

def forgot_password_service(*, email:str):
    user = Account.objects.filter(email = email,is_active=True).first()

    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:3000/reset-password?uid={uid}&token={token}"
        send_mail(
            subject='[JVN] Yêu cầu đặt lại mật khẩu',
            message=f'Xin chào {user.name},\n\nVui lòng click vào link sau để đổi mật khẩu:\n{reset_link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.',
            from_email='noreply@jvn.com',
            recipient_list=[user.email],
            fail_silently=False,
        )

def reset_password_service(*, data:dict):
    try:
        uid = force_str(urlsafe_base64_decode(data.get('uid')))
        user = Account.objects.get(pk = uid)
    except:
        user = None
    
    if user and default_token_generator.check_token(user,data.get('token')):
        user.set_password(data.get('new_password'))
        user.save(update_fields=['password'])
    else:
        raise ValidationError({'token':'Duong dan khoi phuc khong hop le hoac da het han'})

@transaction.atomic    
def follow_service(*,user : Account,company_id:int):
    if user.role != Account.ROLE_CHOICES.SEEKER:
        raise ValidationError({'detail':'Chi co nguoi tim viec moi duoc theo doi cong ty'})
    company = get_object_or_404(Company, pk=company_id)
    job_seeker = user.jobseeker

    follow_record = Follow.objects.filter(company = company,job_seeker=job_seeker).first()

    if follow_record:
        follow_record.delete()
        is_following = False
        message = f'Da bo theo doi cong ty {company.account.name}'
    else:
        Follow.objects.create(
            job_seeker=job_seeker,
            company=company
        )
        is_following = True
        message = f'Theo doi thanh cong cong ty {company.account.name}'
    return {
        'is_following':is_following,
        'message':message
    }

signer = TimestampSigner(salt='email-verification')
EMAIL_TOKEN_MAX_AGE = 60*60*0.5

def generate_email_verification_token(*, account_id: int) -> str:
    return signer.sign(str(account_id))

def verify_email_verification_token(*, token: str)->int:
    try:
        value = signer.unsign(token, max_age= EMAIL_TOKEN_MAX_AGE)
        return int(value)
    except (BadSignature, SignatureExpired):
        raise ValidationError(
            {'error':'Vertification link was expired or invalid'}
        )
    
@transaction.atomic
def send_email_verification_service(*, user: Account):
    if user.email_verified:
        raise ValidationError({'error': 'Email đã được xác thực trước đó'})
    base_url = settings.EMPLOYER_FRONTEND_URL if user.role == Account.ROLE_CHOICES.COMPANY else settings.SEEKER_FRONTEND_URL
    token = signer.sign(str(user.id))
    verify_url = f"{base_url}/verify-email?token={token}"
    transaction.on_commit(lambda: send_verification_email_task.delay(user.email, user.name, verify_url))
    return {'message': f'Đã gửi email xác thực tới {user.email}'}

@transaction.atomic
def confirm_email_verification_service(*, token):
    account_id = verify_email_verification_token(token= token)
    account = get_object_or_404(Account, pk= account_id)
    if account.email_verified:
        return {'message':'Account has been verified'}
    account.email_verified = True
    account.save(update_fields=['email_verified'])
    return {'message':'Verify successfully'}

@transaction.atomic
def submit_business_certificate(*, user:Account, document):
    have_role(user=user, role='company')
    validate_file(file_obj=document)
    company = user.company
    if company.business_cert_status == Company.CertStatus.APPROVED:
        raise ValidationError({'error': 'You have submit your bussiness certificate'})
    company.business_cert_document = document
    company.business_cert_status = Company.CertStatus.PENDING
    company.business_cert_rejected_reason = None
    company.save(update_fields = ['business_cert_document', 'business_cert_status', 'business_cert_rejected_reason'])
    return company

def approve_business_certificate(*, user: Account, company_id: int):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionError({'error': 'You dont have the permission to approve the certificate'})  
    company = get_object_or_404(Company, pk = company_id)
    company.business_cert_status = Company.CertStatus.APPROVED
    company.business_cert_reviewed_at = timezone.now()
    company.save(update_fields=['business_cert_status', 'business_cert_reviewed_at'])
    return company

def reject_business_certificate(*, user: Account, company_id, reason):
    if user.role != Account.ROLE_CHOICES.ADMIN:
        raise PermissionError({'error':'You dont have the permission to reject the certificate'})
    company = get_object_or_404(Company, pk = company_id)
    company.business_cert_status = company.CertStatus.REJECTED
    company.business_cert_reviewed_at = timezone.now()
    company.business_cert_rejected_reason = reason
    company.save(update_fields=['business_cert_status', 'business_cert_reviewed_at', 'business_cert_rejected_reason'])
    return company

    