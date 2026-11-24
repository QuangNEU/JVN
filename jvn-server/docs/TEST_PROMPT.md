# Yêu cầu sinh test cho JVN

## Quy tắc bắt buộc
- Dùng `django.test.TestCase` và `rest_framework.test.APIClient`
- Dùng `force_authenticate(user=...)`, không gọi endpoint login
- Mock Celery bằng `@patch('celery.app.task.Task.delay')`
- Không gọi mạng thật, không gọi Cloudinary thật
- Mỗi test tự tạo dữ liệu riêng, không phụ thuộc test khác
- Assert theo giá trị DB thật (ví dụ `"PUBLISHED"` không phải `PUBLISH`)
- Sau khi `.update()` phải gọi `refresh_from_db()` trước khi assert
- KHÔNG sửa bất kỳ file nào ngoài thư mục `tests/`
- Nếu phát hiện bug trong code production, giữ test và thêm `# BUG:`

## Bước 1: Đọc code trước khi viết
Đọc các file sau và liệt kê tên hàm, tên field, giá trị trạng thái thực tế:
- `apps/applications/services.py`
- `apps/applications/models.py`
- `apps/jobs/models.py`
- `apps/jobs/services.py`
- `apps/accounts/models.py`
- `apps/accounts/services.py`
- `core/permission.py`

Nếu tên hàm hoặc tên field không khớp với kế hoạch bên dưới, báo lại trước khi viết.

## Bước 2: Tạo file helper dùng chung
Tạo `apps/applications/tests/utils.py` với các hàm:
- `make_account(role, email, ...)` tạo Account theo role
- `make_company(account, verification_level=2)` tạo Company
- `make_job(company, status="PUBLISHED", ...)` tạo JobPost
- `make_cv(seeker)` tạo CV thuộc seeker
- `make_seeker(account)` tạo JobSeeker

## Bước 3: Viết test nhóm A — Apply job
File: `apps/applications/tests/test_apply.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| A1 | test_seeker_apply_success | Tạo Application, status SENT |
| A2 | test_apply_expired_job_rejected | Bị từ chối, không tạo Application |
| A3 | test_apply_soft_deleted_job_rejected | Bị từ chối, không tạo Application |
| A4 | test_apply_with_other_seeker_cv_rejected | Bị từ chối, không tạo Application |
| A5 | test_duplicate_apply_blocked | Vẫn chỉ có 1 Application |

Dừng lại sau khi viết xong nhóm A. Chờ xác nhận test pass rồi mới làm nhóm tiếp.

## Bước 4: Viết test nhóm B — JobPost workflow
File: `apps/jobs/tests/test_post_workflow.py`

Đọc thêm:
- `apps/jobs/services.py`
- `apps/jobs/validators.py` (nếu có)

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| B1 | test_suspicious_content_goes_pending | Status PENDING, Admin nhận notification |
| B2 | test_clean_content_goes_pending_or_published | Đúng theo nghiệp vụ thực tế trong code |
| B3 | test_auto_rejected_by_content_check | Status REJECTED, có rejected_reason |
| B4 | test_edit_content_resets_to_pending | Status về PENDING hoặc REJECTED |
| B5 | test_approve_only_pending | Raise lỗi nếu job không phải PENDING |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 5: Viết test nhóm C — Duyệt, từ chối, đóng tin
File: `apps/jobs/tests/test_post_review.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| C1 | test_reject_requires_reason | Lỗi validation, status không đổi |
| C2 | test_close_expired_only_closes_published | Chỉ job PUBLISHED thành CLOSED |
| C3 | test_pending_not_in_public_list | Không xuất hiện trong kết quả public |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 6: Viết test nhóm D — Report (Báo cáo vi phạm - Đạt 100% Coverage)
File: `apps/reports/tests/test_report_service.py`

Đọc thêm:
- `apps/reports/services.py`
- `apps/reports/models.py`
- `apps/reports/selectors.py`
- `apps/reports/views.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| D1 | test_duplicate_job_report_blocked | Bị chặn khi report trùng Job, vẫn 1 report |
| D2 | test_duplicate_company_report_blocked | Bị chặn khi report trùng Company, vẫn 1 report |
| D3 | test_only_seeker_can_report | Company bị chặn 403, Anonymous bị 401 |
| D4 | test_resolve_cascades_to_other_pending | Cả 3 report chuyển RESOLVED |
| D5 | test_dismiss_cascades_and_requires_note | Dismiss bắt buộc admin_note, cascade sang DISMISSED |
| D6 | test_second_admin_gets_409 | Admin 2 xử lý report đã xong -> HTTP 409 |
| D7 | test_admin_list_reports_filter | Admin lấy danh sách và lọc theo status |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 7: Viết test nhóm E — Khóa tài khoản & Audit Trail (Đạt 100% Coverage)
File: `apps/accounts/tests/test_lock_company.py`

Đọc thêm:
- `apps/companies/services.py`
- `apps/accounts/services.py`
- `apps/accounts/models.py`
- `core/permission.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| E1 | test_lock_hides_published_jobs_and_logs | is_locked=True, job ẩn, có AccountLockHistory |
| E2 | test_unlock_restores_hidden_jobs | Mở khóa, job hiện lại trên public |
| E3 | test_locked_account_cannot_login | Raise ValueError ở service, HTTP 401 ở API Login |
| E4 | test_locked_session_blocked_by_permission | HTTP 403, code=account_locked |
| E5 | test_lock_and_unlock_seeker_with_audit_log | Khóa và mở khóa Seeker kèm log |
| E6 | test_already_locked_or_unlocked_validation | Khóa tài khoản đã khóa báo lỗi 400 |
| E7 | test_get_account_lock_history_api | Admin xem danh sách lịch sử khóa/mở khóa |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 8: Viết test nhóm F — Phân quyền & Kiểm soát truy cập (Đạt 100% Coverage)
File: `apps/accounts/tests/test_permissions.py`

Đọc thêm:
- `core/permission.py`
- `apps/accounts/models.py`
- `apps/companies/views.py`
- `apps/applications/views.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| F1 | test_anonymous_gets_401 | Gọi endpoint bảo vệ khi chưa đăng nhập -> HTTP 401 |
| F2 | test_seeker_forbidden_on_company_endpoints | Seeker gọi endpoint của Company -> HTTP 403 |
| F3 | test_company_forbidden_on_seeker_endpoints | Company gọi endpoint của Seeker -> HTTP 403 |
| F4 | test_non_admin_forbidden_on_admin_endpoints | Seeker/Company gọi endpoint của Admin -> HTTP 403 |
| F5 | test_cross_company_access_forbidden_idor | Công ty A sửa/xóa tin của Công ty B -> HTTP 403 (chống IDOR) |
| F6 | test_core_permission_helpers_unit | Unit test cho have_role và get_owned_or_403 |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 9: Viết test nhóm G — Company Verification & Category Hierarchy
File: `apps/jobs/tests/test_category_and_verification.py`

Đọc thêm:
- `apps/jobs/services.py`
- `apps/jobs/selectors.py`
- `apps/accounts/selectors.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| G1 | test_unverified_company_cannot_create_job | Cấp < 2 bị chặn 403 khi tạo JobPost |
| G2 | test_unverified_company_cannot_create_category | Cấp < 2 bị chặn 403 khi tạo Category |
| G3 | test_admin_create_category_approved | Admin tạo category -> status APPROVED |
| G4 | test_category_max_two_levels | Chặn tạo category con cấp 3 |
| G5 | test_job_cannot_assign_non_leaf_category | Bị chặn nếu gán category cha |
| G6 | test_job_assign_valid_leaf_category_success | Gán category lá thành công |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 10: Viết test nhóm H — NTD duyệt đơn ứng tuyển
File: `apps/applications/tests/test_application_review.py`

Đọc thêm:
- `apps/applications/services.py`
- `apps/applications/serializers.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| H1 | test_interview_requires_date | Chuyển INTERVIEWING thiếu ngày -> Lỗi 400 |
| H2 | test_update_status_interviewing_success | Chuyển INTERVIEWING có ngày -> Thành công, gửi notif |
| H3 | test_reject_application_stores_reason | Chuyển REJECTED lưu rejected_reason |
| H4 | test_other_company_cannot_update_application | Công ty khác sửa đơn -> 404/403 (chống IDOR) |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 11: Viết test nhóm I — File & Token Verification
File: `apps/accounts/tests/test_auth_and_verification.py`

Đọc thêm:
- `apps/accounts/services.py`
- `core/validator.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| I1 | test_upload_file_oversize_rejected | File > 5MB bị từ chối |
| I2 | test_upload_file_invalid_mime_rejected | File giả mạo extension/MIME bị từ chối |
| I3 | test_expired_email_token_rejected | Token quá 30 phút bị từ chối |
| I4 | test_valid_email_token_verified | Token hợp lệ -> email_verified=True |

## Quy tắc cho mọi bước
- Mỗi bước dừng lại sau khi viết xong, không tự làm bước tiếp.
- KHÔNG sửa file nào ngoài thư mục `tests/`.
- Nếu tên hàm không tìm thấy trong code, báo lại thay vì tự đoán.
- Dùng lại hàm helper từ `apps/applications/tests/utils.py`.