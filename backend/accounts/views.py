import json
import re

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator, EmptyPage

from .decorators import require_auth
from .models import Attachment, Chat, ChatMember, Message


# =========================================================
# Helpers
# =========================================================

def parse_json_body(request):

    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:

        return None, JsonResponse(
            {
                "error": "Invalid JSON"
            },
            status=400
        )

    if not isinstance(data, dict):

        return None, JsonResponse(
            {
                "error": "Request body must be a JSON object"
            },
            status=400
        )

    return data, None


def serialize_chat(chat):

    return {
        "id": chat.id,
        "type": chat.type,
        "name": chat.name,
        "created_at": chat.created_at,
    }

def serialize_chat_member(membership):

    return {
        "id": membership.user.id,
        "username": membership.user.username,
        "role": membership.role,
        "joined_at": membership.joined_at
    }

def serialize_message(message):

    if message.is_deleted:
        content = "This message was deleted."

    else:
        content = message.content

    return {
        "id": message.id,
        "sender": message.sender.username,
        "content": content,
        "chat": message.chat.id,
        "created_at": message.created_at,
        "updated_at": message.updated_at,
        "is_edited": message.is_edited,
        "is_deleted": message.is_deleted,
        "attachments": [
            {
                "id": attachment.id,
                "file": attachment.file.url,
                "file_type": attachment.file_type,
                "created_at": attachment.created_at,
            }
            for attachment in message.attachments.all()
        ],
        "reply_to": (
            {
                "id": message.reply_to.id,
                "sender": message.reply_to.sender.username,
                "content": (
                    "This message was deleted."
                    if message.reply_to.is_deleted
                    else message.reply_to.content
                )
            }
            if message.reply_to
            else None
        ),
    }


def is_chat_member(chat, user):

    return ChatMember.objects.filter(
        chat=chat,
        user=user
    ).exists()


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
# Register
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def register(request):

    data, error = parse_json_body(request)

    if error:
        return error

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

    data, error = parse_json_body(request)

    if error:
        return error

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
            "id": request.user.id,
            "username": request.user.username
        }
    )


# =========================================================
# User Search
# =========================================================

@require_auth
@require_http_methods(["GET"])
def search_users(request):

    query = request.GET.get(
        "q",
        ""
    ).strip()

    if not query:

        return JsonResponse(
            {
                "users": [],
                "status": "success"
            }
        )

    users = User.objects.filter(
        username__icontains=query
    ).exclude(
        id=request.user.id
    ).order_by(
        "username"
    )[:20]

    data = []

    for user in users:

        data.append({
            "id": user.id,
            "username": user.username,
        })

    return JsonResponse(
        {
            "users": data,
            "status": "success"
        }
    )


# =========================================================
# Create Chat
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def create_chat(request):

    data, error = parse_json_body(request)

    if error:
        return error

    chat_type = data.get("type")

    if chat_type != "group":
        return JsonResponse(
            {
                "error": "type must be group"
            },
            status=400
        )

    name = data.get("name")

    if not isinstance(name, str):
        return JsonResponse(
            {
                "error": "name must be a string"
            },
            status=400
        )

    name = name.strip()

    if not name:
        return JsonResponse(
            {
                "error": "name is required"
            },
            status=400
        )

    if len(name) > 100:
        return JsonResponse(
            {
                "error": "name must not exceed 100 characters"
            },
            status=400
        )

    with transaction.atomic():

        chat = Chat.objects.create(
            type="group",
            name=name
        )

        ChatMember.objects.create(
            chat=chat,
            user=request.user,
            role="admin"
        )

    return JsonResponse(
        {
            "chat": serialize_chat(chat),
            "status": "success"
        },
        status=201
    )


# =========================================================
# Create / Get Private Chat
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def create_private_chat(request):

    data, error = parse_json_body(request)

    if error:
        return error

    username = data.get("username")

    if not isinstance(username, str) or not username.strip():

        return JsonResponse(
            {
                "error": "username is required"
            },
            status=400
        )

    username = username.strip()

    target_user = User.objects.filter(
        username=username
    ).first()

    if not target_user:

        return JsonResponse(
            {
                "error": "User not found"
            },
            status=404
        )

    if target_user.id == request.user.id:

        return JsonResponse(
            {
                "error": "You cannot create a private chat with yourself"
            },
            status=400
        )

    existing_chat = Chat.objects.filter(
        type="private",
        memberships__user=request.user
    ).filter(
        memberships__user=target_user
    ).distinct().first()

    if existing_chat:

        return JsonResponse(
            {
                "chat": serialize_chat(existing_chat),
                "status": "success",
                "created": False
            },
            status=200
        )

    with transaction.atomic():

        chat = Chat.objects.create(
            type="private"
        )

        ChatMember.objects.create(
            chat=chat,
            user=request.user,
            role="admin"
        )

        ChatMember.objects.create(
            chat=chat,
            user=target_user,
            role="member"
        )

    return JsonResponse(
        {
            "chat": serialize_chat(chat),
            "status": "success",
            "created": True
        },
        status=201
    )

# =========================================================
# Get Chats
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chats(request):

    members = ChatMember.objects.filter(
        user=request.user
    ).select_related(
        "chat"
    ).order_by(
        "-chat__created_at"
    )

    chats = []

    for member in members:

        chats.append(
            serialize_chat(member.chat)
        )

    return JsonResponse(
        {
            "chats": chats,
            "status": "success"
        },
        status=200
    )

# =========================================================
# Get Chat Detail
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chat_detail(request, chat_id):

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

    membership = ChatMember.objects.filter(
        chat=chat,
        user=request.user
    ).first()

    if not membership:
        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    members = ChatMember.objects.filter(
        chat=chat
    ).select_related(
        "user"
    ).order_by(
        "joined_at"
    )

    return JsonResponse(
        {
            "chat": {
                "id": chat.id,
                "type": chat.type,
                "name": chat.name,
                "created_at": chat.created_at,
                "members": [
                    serialize_chat_member(member)
                    for member in members
                ]
            },
            "status": "success"
        },
        status=200
    )


# =========================================================
# Get Chat Members
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chat_members(request, chat_id):

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

    if not is_chat_member(
        chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    members = ChatMember.objects.filter(
        chat=chat
    ).select_related(
        "user"
    ).order_by(
        "joined_at"
    )

    data = []

    for member in members:

        data.append({
            "id": member.user.id,
            "username": member.user.username,
            "joined_at": member.joined_at,
        })

    return JsonResponse(
        {
            "members": data,
            "status": "success"
        }
    )


# =========================================================
# Add Chat Member
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def add_chat_member(request):

    data, error = parse_json_body(request)

    if error:
        return error

    chat_id = data.get("chat")
    username = data.get("username")

    if not chat_id or not username:

        return JsonResponse(
            {
                "error": "chat and username are required"
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

    membership = ChatMember.objects.filter(
        chat=chat,
        user=request.user
    ).first()

    if not membership:

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    if membership.role != "admin":

        return JsonResponse(
            {
                "error": "Only chat admins can add members"
            },
            status=403
        )

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

    ChatMember.objects.create(
        chat=chat,
        user=user,
        role = "member"
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


# =========================================================
# Remove Chat Member
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def remove_chat_member(
    request,
    chat_id,
    user_id
):

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

    membership = ChatMember.objects.filter(
        chat=chat,
        user=request.user
    ).first()

    if not membership:

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    if membership.role != "admin":

        return JsonResponse(
            {
                "error": "Only chat admins can remove members"
            },
            status=403
        )

    member = ChatMember.objects.filter(
        chat=chat,
        user_id=user_id
    ).first()

    if not member:

        return JsonResponse(
            {
                "error": "User is not a member of this chat"
            },
            status=404
        )

    if member.user_id == request.user.id:

        return JsonResponse(
            {
                "error": (
                    "Use the leave endpoint "
                    "to leave the chat"
                )
            },
            status=400
        )
    if member.role == "admin":

        return JsonResponse(
            {
                "error": "Admins cannot remove other admins"
            },
            status = 403
        )
    member.delete()

    return JsonResponse(
        {
            "message": "User removed successfully",
            "status": "success"
        }
    )


# =========================================================
# Leave Chat
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def leave_chat(request, chat_id):

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

    member = ChatMember.objects.filter(
        chat=chat,
        user=request.user
    ).first()

    if not member:

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    member.delete()

    return JsonResponse(
        {
            "message": "You left the chat",
            "status": "success"
        }
    )


# =========================================================
# Receive Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def receive_message(request):

    data, error = parse_json_body(request)

    if error:
        return error

    content = data.get("content")
    chat_id = data.get("chat")
    reply_to_id = data.get("reply_to")

    # =====================================================
    # Validate Content
    # =====================================================

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

    if len(content) > 4000:

        return JsonResponse(
            {
                "error": "content must not exceed 4000 characters"
            },
            status=400
        )

    # =====================================================
    # Validate Chat ID
    # =====================================================

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

    # =====================================================
    # Find Chat
    # =====================================================

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

    # =====================================================
    # Check Membership
    # =====================================================

    if not is_chat_member(
        chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    # =====================================================
    # Validate Reply Message
    # =====================================================

    reply_to = None

    if reply_to_id is not None:

        try:

            reply_to_id = int(reply_to_id)

        except (TypeError, ValueError):

            return JsonResponse(
                {
                    "error": "reply_to must be a valid integer"
                },
                status=400
            )

        if reply_to_id <= 0:

            return JsonResponse(
                {
                    "error": "reply_to must be a positive integer"
                },
                status=400
            )

        reply_to = Message.objects.filter(
            id=reply_to_id,
            chat=chat
        ).first()

        if not reply_to:

            return JsonResponse(
                {
                    "error": "Reply message not found in this chat"
                },
                status=404
            )

    # =====================================================
    # Create Message
    # =====================================================

    message = Message.objects.create(
        chat=chat,
        sender=request.user,
        content=content,
        reply_to=reply_to,
    )

    return JsonResponse(
        {
            "message": serialize_message(message),
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

    # =====================================================
    # Pagination
    # =====================================================

    try:
        page = int(
            request.GET.get("page", 1)
        )

    except (TypeError, ValueError):
        return JsonResponse(
            {
                "error": "page must be a valid integer"
            },
            status=400
        )

    try:
        limit = int(
            request.GET.get("limit", 50)
        )

    except (TypeError, ValueError):
        return JsonResponse(
            {
                "error": "limit must be a valid integer"
            },
            status=400
        )

    if page <= 0:
        return JsonResponse(
            {
                "error": "page must be a positive integer"
            },
            status=400
        )

    if limit <= 0:
        return JsonResponse(
            {
                "error": "limit must be a positive integer"
            },
            status=400
        )

    # Prevent huge requests
    MAX_LIMIT = 100

    if limit > MAX_LIMIT:
        limit = MAX_LIMIT

    messages = Message.objects.filter(
        chat=chat
    ).select_related(
        "sender",
        "chat",
        "reply_to",
        "reply_to__sender"
    ).prefetch_related(
        "attachments"
    ).order_by(
        "-created_at"
    )

    paginator = Paginator(
        messages,
        limit
    )

    try:
        current_page = paginator.page(page)

    except EmptyPage:
        return JsonResponse(
            {
                "error": "Page does not exist"
            },
            status=404
        )

    data = []

    for message in current_page.object_list:

        data = [
            serialize_message(message)
            for message in current_page.object_list
        ]

    return JsonResponse(
        {
            "messages": data,
            "pagination": {
                "page": current_page.number,
                "limit": limit,
                "total": paginator.count,
                "has_next": current_page.has_next(),
                "has_previous": current_page.has_previous(),
            },
            "status": "success"
        },
        status=200
    )


# =========================================================
# Edit Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["PATCH"])
def edit_message(request, message_id):

    message = Message.objects.filter(
        id=message_id
    ).select_related(
        "sender",
        "chat"
    ).first()

    if not message:

        return JsonResponse(
            {
                "error": "Message not found"
            },
            status=404
        )

    if not is_chat_member(
        message.chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    if message.sender_id != request.user.id:

        return JsonResponse(
            {
                "error": "You can only edit your own messages"
            },
            status=403
        )

    if message.is_deleted:

        return JsonResponse(
            {
                "error": "Deleted messages cannot be edited"
            },
            status=400
        )

    data, error = parse_json_body(request)

    if error:
        return error

    content = data.get("content")

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

    if len(content) > 4000:

        return JsonResponse(
            {
                "error": "content must not exceed 4000 characters"
            },
            status=400
        )

    message.content = content
    message.is_edited = True

    message.save(
        update_fields=[
            "content",
            "is_edited",
            "updated_at"
        ]
    )

    return JsonResponse(
        {
            "message": serialize_message(message),
            "status": "success"
        }
    )


# =========================================================
# Delete Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def delete_message(request, message_id):

    message = Message.objects.filter(
        id=message_id
    ).select_related(
        "chat"
    ).first()

    if not message:

        return JsonResponse(
            {
                "error": "Message not found"
            },
            status=404
        )

    if not is_chat_member(
        message.chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    if message.sender_id != request.user.id:

        return JsonResponse(
            {
                "error": "You can only delete your own messages"
            },
            status=403
        )

    if message.is_deleted:

        return JsonResponse(
            {
                "error": "Message is already deleted"
            },
            status=400
        )

    message.is_deleted = True
    message.content = ""

    message.save(
        update_fields=[
            "is_deleted",
            "content",
            "updated_at"
        ]
    )

    return JsonResponse(
        {
            "message": "Message deleted successfully",
            "status": "success"
        }
    )

# =========================================================
# Forward Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def forward_message(request, message_id):

    data, error = parse_json_body(request)

    if error:
        return error

    target_chat_id = data.get("chat")

    if target_chat_id is None:

        return JsonResponse(
            {
                "error": "chat is required"
            },
            status=400
        )

    try:

        target_chat_id = int(target_chat_id)

    except (TypeError, ValueError):

        return JsonResponse(
            {
                "error": "chat must be a valid integer"
            },
            status=400
        )

    if target_chat_id <= 0:

        return JsonResponse(
            {
                "error": "chat must be a positive integer"
            },
            status=400
        )

    # =====================================================
    # Find Original Message
    # =====================================================

    message = Message.objects.filter(
        id=message_id
    ).select_related(
        "chat",
        "sender"
    ).prefetch_related(
        "attachments"
    ).first()

    if not message:

        return JsonResponse(
            {
                "error": "Message not found"
            },
            status=404
        )

    # =====================================================
    # Check Source Chat Membership
    # =====================================================

    if not is_chat_member(
        message.chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of the source chat"
            },
            status=403
        )

    # =====================================================
    # Deleted Messages Cannot Be Forwarded
    # =====================================================

    if message.is_deleted:

        return JsonResponse(
            {
                "error": "Deleted messages cannot be forwarded"
            },
            status=400
        )

    # =====================================================
    # Find Target Chat
    # =====================================================

    target_chat = Chat.objects.filter(
        id=target_chat_id
    ).first()

    if not target_chat:

        return JsonResponse(
            {
                "error": "Target chat not found"
            },
            status=404
        )

    # =====================================================
    # Check Target Chat Membership
    # =====================================================

    if not is_chat_member(
        target_chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of the target chat"
            },
            status=403
        )

    # =====================================================
    # Create Forwarded Message
    # =====================================================

    with transaction.atomic():

        forwarded_message = Message.objects.create(
            chat=target_chat,
            sender=request.user,
            content=message.content
        )

        # Copy attachments
        for attachment in message.attachments.all():

            Attachment.objects.create(
                message=forwarded_message,
                file=attachment.file,
                file_type=attachment.file_type
            )

    return JsonResponse(
        {
            "message": serialize_message(
                forwarded_message
            ),
            "status": "success"
        },
        status=201
    )


# =========================================================
# Upload Attachment
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def upload_attachment(
    request,
    message_id
):

    message = Message.objects.filter(
        id=message_id
    ).select_related(
        "chat"
    ).first()

    if not message:

        return JsonResponse(
            {
                "error": "Message not found"
            },
            status=404
        )

    if not is_chat_member(
        message.chat,
        request.user
    ):

        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    if message.sender_id != request.user.id:

        return JsonResponse(
            {
                "error": (
                    "You can only add attachments "
                    "to your own messages"
                )
            },
            status=403
        )

    uploaded_file = request.FILES.get("file")
    file_type = request.POST.get("file_type")

    if not uploaded_file:

        return JsonResponse(
            {
                "error": "file is required"
            },
            status=400
        )

    if file_type not in [
        "image",
        "video",
        "audio",
        "file"
    ]:

        return JsonResponse(
            {
                "error": (
                    "file_type must be image, "
                    "video, audio or file"
                )
            },
            status=400
        )

    MAX_FILE_SIZE = 10 * 1024 * 1024

    if uploaded_file.size > MAX_FILE_SIZE:

        return JsonResponse(
            {
                "error": "Maximum file size is 10MB"
            },
            status=400
        )

    attachment = Attachment.objects.create(
        message=message,
        file=uploaded_file,
        file_type=file_type
    )

    return JsonResponse(
        {
            "attachment": {
                "id": attachment.id,
                "file": attachment.file.url,
                "file_type": attachment.file_type,
                "created_at": attachment.created_at,
            },
            "status": "success"
        },
        status=201
    )