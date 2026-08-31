from functools import wraps
from django.http import JsonResponse


def require_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        if not request.user.is_authenticated:
            return JsonResponse(
                {
                    "error": "Authentication required"
                },
                status=401
            )

        return view_func(request, *args, **kwargs)

    return wrapper