from django.contrib import admin
from .models import Account,Company,JobSeeker
# Register your models here.

admin.site.register(Account)
admin.site.register(JobSeeker)
admin.site.register(Company)