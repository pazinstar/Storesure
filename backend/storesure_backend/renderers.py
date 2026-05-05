from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response_data = {
            'status': 'success',
            'data': data,
            'message': None
        }

        # If data contains a 'detail' key (often from DRF exceptions), treat it as a message or error
        if isinstance(data, dict):
            if 'detail' in data:
                response_data['message'] = data['detail']
                response_data['status'] = 'error' if renderer_context['response'].status_code >= 400 else 'success'
                # If error, maybe don't wrap data in 'data' again if it's just the error detail
                if response_data['status'] == 'error':
                    response_data['data'] = None
            
            # Handling pagination results which usually have 'count', 'next', 'previous', 'results'
            if 'results' in data and 'count' in data:
                response_data['data'] = data.pop('results')
                response_data['meta'] = data # count, next, previous

        return super().render(response_data, accepted_media_type, renderer_context)
# ===