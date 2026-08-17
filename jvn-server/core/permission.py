from rest_framework.exceptions import PermissionDenied
from accounts.models import Account

def get_owned_or_403(*, user, profile_attr: str, obj, owner_field: str):
    if not hasattr(user, profile_attr):
        raise PermissionDenied({'detail': 'Khong co quyen han'})
    
    expected_owner = getattr(user, profile_attr)
    
    if not hasattr(obj, owner_field):
        raise PermissionDenied({'detail': 'Khong co quyen truy cap'})
    
    actual_owner = getattr(obj, owner_field)
    if actual_owner != expected_owner:
        raise PermissionDenied({'detail': 'Khong co quyen truy cap'})
    
    return obj

def have_role(*,user: Account,role:str):
    if not (hasattr(user, role) or (user.role == role)):
        raise PermissionDenied({'detail': 'Khong co quyen han'})
    return True