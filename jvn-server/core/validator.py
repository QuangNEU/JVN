import re
import os
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q
from rest_framework.exceptions import ValidationError


def validate_tel(value):
    if value:
        rule = re.compile(r'^(0|\+84)[35789][0-9]{8}$')
        if not rule.match(value):
            raise serializers.ValidationError("So dien thoai khong dung dinh dang")
    return value

def validate_strong_password(value):
    try:
        django_validate_password(value)
    except DjangoValidationError as e:
        raise serializers.ValidationError(list(e.messages))
    return value
def validate_html_tag(value):
    html_pattern = re.compile(r'<[^>]+>')
    
    if html_pattern.search(value):
        raise ValidationError("Dữ liệu không hợp lệ. Vui lòng không nhập các thẻ HTML.")
    
    return value

def validate_file(file_obj):
    """
    Hàm kiểm tra tính hợp lệ của file upload (CV/Ảnh).
    """
    if not file_obj:
        return

    # 1. Kiểm tra dung lượng (Ví dụ giới hạn 5MB)
    MAX_SIZE = 5 * 1024 * 1024 # 
    if file_obj.size > MAX_SIZE:
        raise ValidationError({
            'file': f'Dung lượng file quá lớn ({file_obj.size / (1024*1024):.1f}MB). Tối đa cho phép là 5MB.'
        })

    # 2. Kiểm tra phần mở rộng (File Extension)
    valid_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    ext = os.path.splitext(file_obj.name)[1].lower()
    
    if ext not in valid_extensions:
        raise ValidationError({
            'file': f'Định dạng "{ext}" không được hỗ trợ. Vui lòng tải lên PDF, DOC, DOCX, JPG hoặc PNG.'
        })

    # 3. Kiểm tra MIME Type (Chống user đổi đuôi file .exe thành .pdf)
    valid_mime_types = [
        'application/pdf',
        'application/msword',                                                      
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  
        'image/jpeg',
        'image/png'
    ]
    
    # content_type lấy từ header HTTP khi file được upload lên
    if file_obj.content_type not in valid_mime_types:
        raise ValidationError({
            'file': 'Nội dung file không hợp lệ hoặc bị lỗi.'
        })
    
# jobs/validators.py (hoặc core/validators.py nếu muốn dùng chung sau này cho cả company description)
SUSPICIOUS_KEYWORDS = [
    'việc nhẹ lương cao', 'không cần kinh nghiệm thu nhập khủng',
    'thu nhập khủng', 'kiếm tiền tại nhà', 'chuyển khoản trước',
    # danh sách mở rộng dần theo thực tế, không cần đầy đủ ngay từ đầu
]

URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')
ALLOWED_DOMAINS = []  

def check_job_content(title: str, description: str) -> tuple[bool, str | None]:
    """Trả (is_suspicious, reason). Không raise — để service quyết định set PENDING hay auto-REJECTED."""
    text = f"{title} {description}".lower()
    
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in text:
            return True, f"Chứa từ khóa nghi ngờ: '{kw}'"
    
    urls = URL_PATTERN.findall(description)
    if urls and not all(any(d in u for d in ALLOWED_DOMAINS) for u in urls):
        return True, "Chứa liên kết ngoài không xác định"
    
    if len(description.strip()) < 50:
        return True, "Mô tả công việc quá ngắn"
    
    return False, None