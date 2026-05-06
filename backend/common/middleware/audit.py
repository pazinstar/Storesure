import logging
from django.utils.timezone import now

logger = logging.getLogger('storesure.audit')


class AuditMiddleware:
    """Simple audit middleware that logs write operations (POST/PUT/PATCH/DELETE).

    It does not write to the database (keeps Phase 1 lightweight). It emits
    structured logs containing user info (when available), path, method,
    timestamp and request body size. This is useful from Phase 1 onward
    to ensure an audit trail exists for mutating requests.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        method = request.method.upper()
        is_write = method in ('POST', 'PUT', 'PATCH', 'DELETE')

        user = getattr(request, 'user', None)
        username = getattr(user, 'username', None) if user and user.is_authenticated else 'anonymous'

        if is_write:
            try:
                payload_size = len(request.body) if hasattr(request, 'body') and request.body is not None else 0
            except Exception:
                payload_size = 0

            logger.info(
                'audit.request',
                extra={
                    'audit': True,
                    'user': username,
                    'method': method,
                    'path': request.path,
                    'timestamp': now().isoformat(),
                    'payload_size': payload_size,
                    'remote_addr': request.META.get('REMOTE_ADDR'),
                }
            )
            from common.messaging.models import AuditLog
            payload = None
            try:
                payload = request.body.decode('utf-8')
            except Exception:
                payload = str(request.POST.dict())
            # resolver_match may be None at this stage for some requests
            resolver = getattr(request, 'resolver_match', None)
            entity_id = ''
            try:
                if resolver and getattr(resolver, 'kwargs', None):
                    # prefer common identifier keys
                    entity_id = resolver.kwargs.get('pk') or resolver.kwargs.get('id') or ''
            except Exception:
                entity_id = ''

            AuditLog.objects.create(
                entity=request.path,
                entity_id=entity_id,
                action=request.method,
                user_id=(getattr(request.user, 'username', 'anonymous') if getattr(request, 'user', None) else 'system'),
                new_values=payload,
            )

        response = self.get_response(request)

        if is_write:
            # Signal via response header that an audit entry was logged.
            try:
                response['X-Audit-Logged'] = 'true'
            except Exception:
                pass

        return response
