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

## Bước 6: Viết test nhóm D — Report
File: `apps/reports/tests/test_report_service.py`

Đọc thêm:
- `apps/reports/services.py`
- `apps/reports/models.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| D1 | test_duplicate_report_blocked | Bị chặn, vẫn 1 report |
| D2 | test_resolve_cascades_to_other_pending | Cả 3 report chuyển RESOLVED |
| D3 | test_second_admin_gets_409 | HTTP 409 |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 7: Viết test nhóm E — Khóa tài khoản
File: `apps/accounts/tests/test_lock_company.py`

Đọc thêm:
- `apps/accounts/services.py`
- `apps/accounts/models.py`
- `core/permission.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| E1 | test_lock_hides_published_jobs_and_logs | is_locked=True, job ẩn, có AccountLockHistory |
| E2 | test_unlock_restores_hidden_jobs | Mở khóa, job hiện lại |
| E3 | test_locked_account_cannot_login | Raise ValueError |
| E4 | test_locked_session_blocked_by_permission | HTTP 403, code=account_locked |

Dừng lại, chờ xác nhận pass rồi mới làm nhóm tiếp.

## Bước 8: Viết test nhóm F — Phân quyền
File: `apps/accounts/tests/test_permissions.py`

| ID | Tên test | Kết quả mong đợi |
|----|----------|-----------------|
| F1 | test_seeker_forbidden_on_company_endpoint | HTTP 403 |
| F2 | test_anonymous_gets_401 | HTTP 401 |

## Quy tắc cho mọi bước
- Mỗi bước dừng lại sau khi viết xong, không tự làm bước tiếp.
- KHÔNG sửa file nào ngoài thư mục `tests/`.
- Nếu tên hàm không tìm thấy trong code, báo lại thay vì tự đoán.
- Dùng lại hàm helper từ `apps/applications/tests/utils.py`.