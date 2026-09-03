from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc=exc, context=context)

    if response is not None:
        custom_response = {
            "success": False,
            "error": "Đã có lỗi xảy ra.",
            "field": None,
            "code": None,
        }
        if response.status_code == 400:
            if isinstance(response.data, dict):
                for field, errors in response.data.items():
                    custom_response["field"] = field
                    if isinstance(errors, list) and len(errors) > 0:
                        custom_response["error"] = str(errors[0])
                    elif isinstance(errors, str):
                        custom_response["error"] = errors
                    break
            elif isinstance(response.data, list) and len(response.data) > 0:
                custom_response["error"] = str(response.data[0])
            elif isinstance(response.data, str):
                custom_response["error"] = response.data

        elif response.status_code in [401, 403]:
            if isinstance(response.data, dict) and 'detail' in response.data:
                custom_response["error"] = str(response.data['detail'])
                custom_response["code"] = response.data.get('code')   # thêm dòng này
            elif isinstance(response.data, list) and len(response.data) > 0:
                custom_response["error"] = str(response.data[0])
            else:
                custom_response["error"] = "Xác thực không thành công hoặc phiên đăng nhập hết hạn."

        response.data = custom_response
    return response