from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc=exc, context= context)

    if response  is not None:
        for field, errors in response.data.items():
            if isinstance(errors, list) and errors:
                response.data = {
                    "success": False,
                    "error": errors[0], 
                    "field": field        
                }
                break
            elif isinstance(errors, str):
                response.data = {
                    "success": False,
                    "error": errors,
                    "field": field,
                }
                break

    return response