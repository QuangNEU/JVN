from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Account, Company, JobSeeker


class AccountCreationForm(UserCreationForm):
    class Meta:
        model = Account
        fields = ('email', 'name', 'role')


class AccountChangeForm(UserChangeForm):
    class Meta:
        model = Account
        fields = '__all__'


class AccountAdmin(UserAdmin):
    model = Account
    add_form = AccountCreationForm
    form = AccountChangeForm

    list_display = ('email', 'name', 'role', 'is_active', 'is_staff', 'email_verified')
    list_filter = ('role', 'is_active', 'is_staff', 'email_verified')
    search_fields = ('email', 'name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Thông tin cá nhân', {'fields': ('name', 'tel', 'role')}),
        ('Trạng thái', {'fields': ('is_active', 'is_staff', 'is_superuser', 'email_verified')}),
        ('Ngày tháng', {'fields': ('last_login', 'date_joined')}),
        ('Phân quyền nâng cao', {'fields': ('groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )


admin.site.register(Account, AccountAdmin)
admin.site.register(JobSeeker)
admin.site.register(Company)