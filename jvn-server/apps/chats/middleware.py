from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_ticket(ticket):
    from accounts.models import Account
    user_id = cache.get(f'ws_ticket:{ticket}')
    if user_id is None:
        return AnonymousUser()

    cache.delete(f'ws_ticket:{ticket}')  

    try:
        return Account.objects.get(pk=user_id)
    except Account.DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        ticket = query_params.get('ticket', [None])[0]

        if ticket:
            scope['user'] = await get_user_from_ticket(ticket)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)