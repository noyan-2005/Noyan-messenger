from django.http import JsonResponse
import json
import re

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token
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
# CSRF Token
# =========================================================

@require_http_methods(["GET"])
def csrf_token(request):

    token = get_token(request)

    return JsonResponse({
        "csrfToken": token
    })


# =========================================================
# Receive Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def receive_message(request):

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

    content = data.get("content")
    chat_id = data.get("chat")

    if not isinstance(content, str):
        return JsonResponse(
            {
                "error": "content must be a string"
            },
            status=400
        )

    content = content.strip()

    if not content:
        return JsonResponse(
            {
                "error": "content is required"
            },
            status=400
        )

    MAX_MESSAGE_LENGTH = 4000

    if len(content) > MAX_MESSAGE_LENGTH:
        return JsonResponse(
            {
                "error": (
                    f"content must not exceed "
                    f"{MAX_MESSAGE_LENGTH} characters"
                )
            },
            status=400
        )

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

    message = Message.objects.create(
        chat=chat,
        sender=sender,
        content=content
    )

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

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )

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

    if User.objects.filter(
        username=username
    ).exists():

        return JsonResponse(
            {
                "error": "username is unavailable"
            },
            status=400
        )

    try:
        validate_password(password)

    except ValidationError as e:
        return JsonResponse(
            {
                "error": e.messages
            },
            status=400
        )

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

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )

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

# =========================================================
# Create Chat
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def create_chat(request):
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error" : "Invalid JSON"
            },
            status = 400
        )
        
    if not isinstance(data, dict):
        return JsonResponse(
            {
                "error" : "Request body must be a JSON object"
            },
            status = 400
        )
    
    chat_type = data.get("type")
    
    if chat_type not in ["private", "group"]:
        return JsonResponse(
            {
                "error" : "type must be private or group"
            },
            status = 400
        )    
    
    # Create chat
    chat = Chat.objects.create(
        type = chat_type
    )
    
    # Automatically add creator as member
    ChatMember.objects.create(
        chat = chat,
        user = request.user
    )
    
    return JsonResponse(
        {
            "chat":{
                "id": chat.id,
                "type": chat.type,
                "created_at": chat.created_at
            },
            "status" : "success"
        },
        status = 201
    )
    
# =========================================================
# Add Chat Member
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def add_chat_member(request):

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

    chat_id = data.get("chat")
    username = data.get("username")

    # Validate fields
    if not chat_id or not username:
        return JsonResponse(
            {
                "error": "chat and username are required"
            },
            status=400
        )

    # Find chat
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

    # Check that requester is a member
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

    # Find user
    user = User.objects.filter(
        username=username
    ).first()

    if not user:
        return JsonResponse(
            {
                "error": "User not found"
            },
            status=404
        )

    # Check if already a member
    if ChatMember.objects.filter(
        chat=chat,
        user=user
    ).exists():

        return JsonResponse(
            {
                "error": "User is already a member of this chat"
            },
            status=400
        )

    # Add member
    ChatMember.objects.create(
        chat=chat,
        user=user
    )

    return JsonResponse(
        {
            "message": "User added successfully",
            "chat": chat.id,
            "username": user.username,
            "status": "success"
        },
        status=201
    )