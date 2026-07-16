from rest_framework.exceptions import PermissionDenied

def get_owend_or_403(*,obj, owner_field,expected_owner):
    if not hasattr(obj,owner_field):
        raise PermissionDenied({'detail':'Khong co quyen truy cap'})
    actual_owner = getattr(obj,owner_field)
    if actual_owner != expected_owner:
        raise PermissionDenied({'detail':'Khong co quyen truy cap'})
    return obj
