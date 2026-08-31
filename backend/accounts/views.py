from django.http import JsonResponse
import json
import re

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Message, Chat, ChatMember
from .decorators import require_auth


# =========================================================
# Hello
# =========================================================

@require_http_methods(["GET"])
def hello(request):

    name = request.GET.get("name")

    return JsonResponse({
        "message": f"Hello {name}!",
        "status": "success"
    })


# =========================================================
# Receive Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def receive_message(request):

    # -----------------------------------------------------
    # Parse JSON
    # -----------------------------------------------------

    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON"
            },
            status=400
        )

    # JSON body must be an object
    if not isinstance(data, dict):
        return JsonResponse(
            {
                "error": "Request body must be a JSON object"
            },
            status=400
        )

    # -----------------------------------------------------
    # Get fields
    # -----------------------------------------------------

    content = data.get("content")
    chat_id = data.get("chat")

    # -----------------------------------------------------
    # Validate content type
    # -----------------------------------------------------

    if not isinstance(content, str):
        return JsonResponse(
            {
                "error": "content must be a string"
            },
            status=400
        )

    # Remove unnecessary spaces
    content = content.strip()

    # -----------------------------------------------------
    # Validate empty content
    # -----------------------------------------------------

    if not content:
        return JsonResponse(
            {
                "error": "content is required"
            },
            status=400
        )

    # -----------------------------------------------------
    # Validate message length
    # -----------------------------------------------------

    MAX_MESSAGE_LENGTH = 4000

    if len(content) > MAX_MESSAGE_LENGTH:
        return JsonResponse(
            {
                "error": f"content must not exceed {MAX_MESSAGE_LENGTH} characters"
            },
            status=400
        )

    # -----------------------------------------------------
    # Validate chat ID
    # -----------------------------------------------------

    if chat_id is None:
        return JsonResponse(
            {
                "error": "chat is required"
            },
            status=400
        )

    try:
        chat_id = int(chat_id)

    except (TypeError, ValueError):
        return JsonResponse(
            {
                "error": "chat must be a valid integer"
            },
            status=400
        )

    if chat_id <= 0:
        return JsonResponse(
            {
                "error": "chat must be a positive integer"
            },
            status=400
        )

    # -----------------------------------------------------
    # Find chat
    # -----------------------------------------------------

    chat = Chat.objects.filter(
        id=chat_id
    ).first()

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    # -----------------------------------------------------
    # Check membership
    # -----------------------------------------------------

    sender = request.user

    is_member = ChatMember.objects.filter(
        chat=chat,
        user=sender
    ).exists()

    if not is_member:
        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    # -----------------------------------------------------
    # Create message
    # -----------------------------------------------------

    message = Message.objects.create(
        chat=chat,
        sender=sender,
        content=content
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return JsonResponse(
        {
            "message": {
                "id": message.id,
                "sender": message.sender.username,
                "content": message.content,
                "chat": message.chat.id,
                "created_at": message.created_at,
                "updated_at": message.updated_at,
                "is_edited": message.is_edited,
            },

            "status": "success"
        },
        status=201
    )


# =========================================================
# Get Messages
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_messages(request):

    chat_id = request.GET.get("chat")

    # -----------------------------------------------------
    # Validate chat ID
    # -----------------------------------------------------

    if not chat_id:
        return JsonResponse(
            {
                "error": "chat is required"
            },
            status=400
        )

    try:
        chat_id = int(chat_id)

    except (TypeError, ValueError):
        return JsonResponse(
            {
                "error": "chat must be a valid integer"
            },
            status=400
        )

    if chat_id <= 0:
        return JsonResponse(
            {
                "error": "chat must be a positive integer"
            },
            status=400
        )

    # -----------------------------------------------------
    # Find chat
    # -----------------------------------------------------

    chat = Chat.objects.filter(
        id=chat_id
    ).first()

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    # -----------------------------------------------------
    # Check membership
    # -----------------------------------------------------

    is_member = ChatMember.objects.filter(
        chat=chat,
        user=request.user
    ).exists()

    if not is_member:
        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    # -----------------------------------------------------
    # Get messages
    # -----------------------------------------------------

    messages = Message.objects.filter(
        chat=chat
    ).select_related(
        "sender"
    ).order_by(
        "created_at"
    )

    data = []

    for message in messages:

        data.append({
            "id": message.id,
            "sender": message.sender.username,
            "content": message.content,
            "created_at": message.created_at,
            "chat": message.chat.id,
            "updated_at": message.updated_at,
            "is_edited": message.is_edited,
        })

    return JsonResponse(
        data,
        safe=False
    )


# =========================================================
# Register
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def register(request):

    # -----------------------------------------------------
    # Parse JSON
    # -----------------------------------------------------

    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON"
            },
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {
                "error": "Request body must be a JSON object"
            },
            status=400
        )

    # -----------------------------------------------------
    # Get fields
    # -----------------------------------------------------

    username = data.get("username")
    password = data.get("password")

    # -----------------------------------------------------
    # Required fields
    # -----------------------------------------------------

    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )

    # -----------------------------------------------------
    # Username validation
    # -----------------------------------------------------

    if not isinstance(username, str):
        return JsonResponse(
            {
                "error": "username must be a string"
            },
            status=400
        )

    username = username.strip()

    if not re.fullmatch(
        r"[A-Za-z0-9_]{3,30}",
        username
    ):
        return JsonResponse(
            {
                "error": (
                    "Username must be 3-30 characters "
                    "and contain only letters, numbers, "
                    "and underscores"
                )
            },
            status=400
        )

    # -----------------------------------------------------
    # Check username availability
    # -----------------------------------------------------

    if User.objects.filter(
        username=username
    ).exists():

        return JsonResponse(
            {
                "error": "username is unavailable"
            },
            status=400
        )

    # -----------------------------------------------------
    # Validate password
    # -----------------------------------------------------

    try:
        validate_password(password)

    except ValidationError as e:
        return JsonResponse(
            {
                "error": e.messages
            },
            status=400
        )

    # -----------------------------------------------------
    # Create user
    # -----------------------------------------------------

    user = User.objects.create_user(
        username=username,
        password=password
    )

    return JsonResponse(
        {
            "message": "User created successfully",
            "username": user.username
        },
        status=201
    )


# =========================================================
# Login
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def user_login(request):

    # -----------------------------------------------------
    # Parse JSON
    # -----------------------------------------------------

    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON"
            },
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {
                "error": "Request body must be a JSON object"
            },
            status=400
        )

    # -----------------------------------------------------
    # Get fields
    # -----------------------------------------------------

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )

    # -----------------------------------------------------
    # Rate limiting
    # -----------------------------------------------------

    ip = request.META.get(
        "REMOTE_ADDR",
        "unknown"
    )

    cache_key = f"login_attempts_{ip}"

    attempts = cache.get(
        cache_key,
        0
    )

    if attempts >= 3:
        return JsonResponse(
            {
                "error": (
                    "Too many login attempts. "
                    "Try again later."
                )
            },
            status=429
        )

    # -----------------------------------------------------
    # Authenticate
    # -----------------------------------------------------

    user = authenticate(
        username=username,
        password=password
    )

    if user is None:

        cache.set(
            cache_key,
            attempts + 1,
            60
        )

        return JsonResponse(
            {
                "error": "Invalid username or password"
            },
            status=401
        )

    # -----------------------------------------------------
    # Successful login
    # -----------------------------------------------------

    cache.delete(cache_key)

    login(
        request,
        user
    )

    return JsonResponse(
        {
            "message": "Login successful",
            "username": user.username
        },
        status=200
    )


# =========================================================
# Logout
# =========================================================

@require_auth
@require_http_methods(["POST"])
def user_logout(request):

    logout(request)

    return JsonResponse(
        {
            "message": "Logout successful"
        },
        status=200
    )


# =========================================================
# Current User
# =========================================================

@require_auth
@require_http_methods(["GET"])
def me(request):

    return JsonResponse(
        {
            "username": request.user.username
        }
    )