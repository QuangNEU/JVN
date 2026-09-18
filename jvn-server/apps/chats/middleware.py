from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.models import AnonymousUser
from http.cookies import SimpleCookie

@database_sync_to_async
def get_user_from_token(token_str):
    from accounts.models import Account
    try:
        accessToken =AccessToken(token_str)
        user_id = accessToken['user_id']
        return Account.objects.get(pk =user_id)
    except (TokenError, Account.DoesNotExist):
        return AnonymousUser()
    
class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope['headers'])
        cookie_header = headers.get(b'cookie', b'').decode()
        cookies = SimpleCookie()
        cookies.load(cookie_header)

        access_token_cookie = cookies.get('accessToken')
        if access_token_cookie:
            scope['user'] = await get_user_from_token(access_token_cookie.value)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)