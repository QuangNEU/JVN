from django.db import transaction,IntegrityError
from .models import Account,JobSeeker,Company,Follow
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.transport import requests as google_requests
from django.contrib.auth.tokens import default_token_generator
from google.oauth2 import id_token
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes,force_str
import os
import uuid

ALLOWED_SEEKER_FIELDS = ['github_urls']
ALLOWED_COMPANY_FIELDS = ['province', 'ward', 'exact_address', 'description', 'headcount']


def create_user_service(*,email,password,role,name,tel = None,province = None,ward = None):
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

    if not email:
        raise ValidationError('Khong lay duoc email tu tai khoan google nay')
    
    user = Account.objects.filter(email = email).first()

    if not user:
        if not role:
            raise ValidationError('Tai khoan chua ton tai vui long cap role')
        
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
            ward=default_ward
        )

        user.set_unusable_password()
        user.save(update_my_detail_service(['password']))
    else:
        if not user.is_active:
            raise ValidationError('Tai khoan nay da bi khoa')
        if role and user.role != role:
            raise ValidationError('Tai khoan nay da duoc dung cho vai tro khac')   
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
        reset_link = f"http://localhost:5173/reset-password?uid={uid}&token={token}"
        send_mail(
            subject='[JVN] Yêu cầu đặt lại mật khẩu',
            message=f'Xin chào {user.name},\n\nVui lòng click vào link sau để đổi mật khẩu:\n{reset_link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.',
            from_email='noreply@jvn.com',
            recipient_list=[user.email],
            fail_silently=False,
        )

def reset_password_service(*, data:dict):
    try:
        uid = force_str(urlsafe_base64_encode(data.get('uid')))
        user = Account.objects.get(pk = uid)
    except:
        user = None
    
    if user and default_token_generator.check_token(user,data.get('token')):
        user.set_password(data.get('new_password'))
        user.save(update_fields=['password'])
    else:
        raise ValidationError({'token':'Duong dan khoi phuc khong hop le hoac da het han'})
    
def follow_service(*,user : Account,company_id:int):
    if user.role != Account.ROLE_CHOICES.SEEKER:
        raise ValidationError({'detail':'Chi co nguoi tim viec moi duoc theo doi cong ty'})
    company = Company.objects.get(pk = company_id)
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
        ),
        is_following = True
        message = f'Theo doi thanh cong cong ty {company.account.name}'
    return {
        'is_following':is_following,
        'message':message
    }