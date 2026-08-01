from django.contrib import admin
from .models import Category, JobPost

admin.site.register(JobPost)
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    # 1. Các cột hiển thị ngoài danh sách
    list_display = ('title', 'status', 'parent', 'created_at')
    
    # 2. Tạo bộ lọc bên tay phải để Admin dễ dàng lọc ra các bài PENDING
    list_filter = ('status', 'created_at')
    
    # 3. Thanh tìm kiếm
    search_fields = ('title',)
    
    # 4. Đăng ký các hành động tùy chỉnh (Actions)
    actions = ['approve_categories', 'reject_categories']

    # --- ĐỊNH NGHĨA LOGIC CHO CÁC HÀNH ĐỘNG ---
    
    @admin.action(description='✅ Duyệt các danh mục đã chọn')
    def approve_categories(self, request, queryset):
        # Dùng queryset.update() để cập nhật DB ngay lập tức (Rất tối ưu)
        updated_count = queryset.update(status=Category.Status.APPROVED)
        
        # Hiển thị thông báo màu xanh lá cây trên giao diện admin
        self.message_user(request, f"Đã duyệt thành công {updated_count} danh mục.")

    @admin.action(description='Từ chối các danh mục đã chọn')
    def reject_categories(self, request, queryset):
        updated_count = queryset.update(status=Category.Status.REJECTED)
        
        # Hiển thị thông báo màu đỏ/vàng trên giao diện
        self.message_user(
            request, 
            f"Đã từ chối {updated_count} danh mục.", 
            level='WARNING'
        )