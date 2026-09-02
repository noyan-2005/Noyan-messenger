import json
import re

from functools import wraps

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator, EmptyPage
from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .decorators import require_auth
from .models import (
    Attachment,
    Chat,
    ChatMember,
    Message,
    MessageRead,
)


# =========================================================
# Constants
# =========================================================

MAX_MESSAGE_LENGTH = 4000
MAX_SEARCH_LENGTH = 100
MAX_MESSAGE_LIMIT = 100
DEFAULT_MESSAGE_LIMIT = 50
MAX_SEARCH_RESULTS = 20
MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_FILE_TYPES = {
    "image",
    "video",
    "audio",
    "file",
}


# =========================================================
# Helpers
# =========================================================

def parse_json_body(request):
    """
    Parse request.body as a JSON object.
    """

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


def get_chat(chat_id):
    """
    Return a chat by ID or None.
    """

    return Chat.objects.filter(
        id=chat_id
    ).first()


def get_message(message_id):
    """
    Return a message with commonly required relations.
    """

    return (
        Message.objects
        .select_related(
            "sender",
            "chat",
            "reply_to",
            "reply_to__sender",
        )
        .prefetch_related(
            "attachments",
        )
        .filter(
            id=message_id
        )
        .first()
    )


def is_chat_member(chat, user):
    """
    Check whether a user belongs to a chat.
    """

    return ChatMember.objects.filter(
        chat=chat,
        user=user
    ).exists()


def get_chat_membership(chat, user):
    """
    Return user's membership in a chat.
    """

    return (
        ChatMember.objects
        .filter(
            chat=chat,
            user=user
        )
        .first()
    )


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
        "joined_at": membership.joined_at,
    }


def serialize_message_read(read):
    return {
        "user_id": read.user_id,
        "username": read.user.username,
        "read_at": read.read_at,
    }


def serialize_message(message):
    """
    Convert a Message instance to JSON-compatible data.
    """

    content = (
        "This message was deleted."
        if message.is_deleted
        else message.content
    )

    reply_to = None

    if message.reply_to:
        reply_to = {
            "id": message.reply_to.id,
            "sender": message.reply_to.sender.username,
            "content": (
                "This message was deleted."
                if message.reply_to.is_deleted
                else message.reply_to.content
            ),
        }

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

        "reply_to": reply_to,
    }


def serialize_chat_preview(chat, user):
    """
    Serialize a chat for the chat list.
    """

    last_message = (
        Message.objects
        .filter(
            chat=chat
        )
        .select_related(
            "sender"
        )
        .order_by(
            "-created_at"
        )
        .first()
    )

    unread_count = (
        Message.objects
        .filter(
            chat=chat,
            is_deleted=False,
        )
        .exclude(
            sender=user
        )
        .exclude(
            reads__user=user
        )
        .count()
    )

    data = serialize_chat(chat)

    data["last_message"] = None

    if last_message:
        data["last_message"] = {
            "id": last_message.id,
            "sender": last_message.sender.username,
            "content": (
                "This message was deleted."
                if last_message.is_deleted
                else last_message.content
            ),
            "created_at": last_message.created_at,
            "is_deleted": last_message.is_deleted,
        }

    data["unread_count"] = unread_count

    return data


# =========================================================
# General
# =========================================================

@require_http_methods(["GET"])
def hello(request):

    name = request.GET.get(
        "name",
        ""
    ).strip()

    return JsonResponse(
        {
            "message": f"Hello {name}!",
            "status": "success",
        }
    )


# =========================================================
# CSRF
# =========================================================

@require_http_methods(["GET"])
def csrf_token(request):

    token = get_token(request)

    return JsonResponse(
        {
            "csrfToken": token,
        }
    )


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

    if not isinstance(password, str):
        return JsonResponse(
            {
                "error": "password must be a string"
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

    except ValidationError as error:
        return JsonResponse(
            {
                "error": error.messages
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
            "username": user.username,
            "status": "success",
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

    if not isinstance(username, str):
        return JsonResponse(
            {
                "error": "username must be a string"
            },
            status=400
        )

    if not isinstance(password, str):
        return JsonResponse(
            {
                "error": "password must be a string"
            },
            status=400
        )

    username = username.strip()

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
    # Authentication
    # -----------------------------------------------------

    user = authenticate(
        request=request,
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
            "username": user.username,
            "user_id": user.id,
            "status": "success",
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
            "message": "Logout successful",
            "status": "success",
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
            "username": request.user.username,
            "status": "success",
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
                "status": "success",
            }
        )

    users = (
        User.objects
        .filter(
            username__icontains=query
        )
        .exclude(
            id=request.user.id
        )
        .order_by(
            "username"
        )[:MAX_SEARCH_RESULTS]
    )

    data = [
        {
            "id": user.id,
            "username": user.username,
        }
        for user in users
    ]

    return JsonResponse(
        {
            "users": data,
            "status": "success",
        }
    )


# =========================================================
# Create Group Chat
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
            "status": "success",
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

    if not isinstance(username, str):
        return JsonResponse(
            {
                "error": "username is required"
            },
            status=400
        )

    username = username.strip()

    if not username:
        return JsonResponse(
            {
                "error": "username is required"
            },
            status=400
        )

    target_user = (
        User.objects
        .filter(
            username=username
        )
        .first()
    )

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
                "error": (
                    "You cannot create a private "
                    "chat with yourself"
                )
            },
            status=400
        )

    # -----------------------------------------------------
    # Check existing private chat
    # -----------------------------------------------------

    existing_chat = (
        Chat.objects
        .filter(
            type="private",
            memberships__user=request.user
        )
        .filter(
            memberships__user=target_user
        )
        .distinct()
        .first()
    )

    if existing_chat:
        return JsonResponse(
            {
                "chat": serialize_chat(existing_chat),
                "status": "success",
                "created": False,
            },
            status=200
        )

    # -----------------------------------------------------
    # Create private chat
    # -----------------------------------------------------

    with transaction.atomic():

        chat = Chat.objects.create(
            type="private"
        )

        ChatMember.objects.bulk_create(
            [
                ChatMember(
                    chat=chat,
                    user=request.user,
                    role="admin"
                ),
                ChatMember(
                    chat=chat,
                    user=target_user,
                    role="member"
                ),
            ]
        )

    return JsonResponse(
        {
            "chat": serialize_chat(chat),
            "status": "success",
            "created": True,
        },
        status=201
    )


# =========================================================
# Get Chats
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chats(request):

    memberships = (
        ChatMember.objects
        .filter(
            user=request.user
        )
        .select_related(
            "chat"
        )
        .order_by(
            "-chat__created_at"
        )
    )

    chats = [
        serialize_chat_preview(
            membership.chat,
            request.user
        )
        for membership in memberships
    ]

    return JsonResponse(
        {
            "chats": chats,
            "status": "success",
        }
    )


# =========================================================
# Get Chat Detail
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chat_detail(request, chat_id):

    chat = get_chat(chat_id)

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

    members = (
        ChatMember.objects
        .filter(
            chat=chat
        )
        .select_related(
            "user"
        )
        .order_by(
            "joined_at"
        )
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
                ],
            },
            "status": "success",
        }
    )


# =========================================================
# Get Chat Members
# =========================================================

@require_auth
@require_http_methods(["GET"])
def get_chat_members(request, chat_id):

    chat = get_chat(chat_id)

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

    members = (
        ChatMember.objects
        .filter(
            chat=chat
        )
        .select_related(
            "user"
        )
        .order_by(
            "joined_at"
        )
    )

    data = [
        {
            "id": member.user.id,
            "username": member.user.username,
            "role": member.role,
            "joined_at": member.joined_at,
        }
        for member in members
    ]

    return JsonResponse(
        {
            "members": data,
            "status": "success",
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

    if chat_id is None or not username:
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

    if chat_id <= 0:
        return JsonResponse(
            {
                "error": "chat must be a positive integer"
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

    chat = get_chat(chat_id)

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    membership = get_chat_membership(
        chat,
        request.user
    )

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

    user = (
        User.objects
        .filter(
            username=username
        )
        .first()
    )

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
        role="member"
    )

    return JsonResponse(
        {
            "message": "User added successfully",
            "chat": chat.id,
            "username": user.username,
            "status": "success",
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

    chat = get_chat(chat_id)

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    membership = get_chat_membership(
        chat,
        request.user
    )

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

    member = (
        ChatMember.objects
        .filter(
            chat=chat,
            user_id=user_id
        )
        .select_related(
            "user"
        )
        .first()
    )

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
            status=403
        )

    member.delete()

    return JsonResponse(
        {
            "message": "User removed successfully",
            "status": "success",
        }
    )


# =========================================================
# Leave Chat
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def leave_chat(request, chat_id):

    chat = get_chat(chat_id)

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    membership = get_chat_membership(
        chat,
        request.user
    )

    if not membership:
        return JsonResponse(
            {
                "error": "You are not a member of this chat"
            },
            status=403
        )

    membership.delete()

    return JsonResponse(
        {
            "message": "You left the chat",
            "status": "success",
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

    # -----------------------------------------------------
    # Content validation
    # -----------------------------------------------------

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

    if len(content) > MAX_MESSAGE_LENGTH:
        return JsonResponse(
            {
                "error": (
                    "content must not exceed "
                    f"{MAX_MESSAGE_LENGTH} characters"
                )
            },
            status=400
        )

    # -----------------------------------------------------
    # Chat ID validation
    # -----------------------------------------------------

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

    chat = get_chat(chat_id)

    if not chat:
        return JsonResponse(
            {
                "error": "Chat not found"
            },
            status=404
        )

    # -----------------------------------------------------
    # Membership
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Reply validation
    # -----------------------------------------------------

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

        reply_to = (
            Message.objects
            .filter(
                id=reply_to_id,
                chat=chat
            )
            .first()
        )

        if not reply_to:
            return JsonResponse(
                {
                    "error": (
                        "Reply message not found "
                        "in this chat"
                    )
                },
                status=404
            )

    # -----------------------------------------------------
    # Create message
    # -----------------------------------------------------

    message = Message.objects.create(
        chat=chat,
        sender=request.user,
        content=content,
        reply_to=reply_to,
    )

    # Reload relations required by serializer
    message = (
        Message.objects
        .select_related(
            "sender",
            "chat",
            "reply_to",
            "reply_to__sender",
        )
        .prefetch_related(
            "attachments",
        )
        .get(
            id=message.id
        )
    )

    return JsonResponse(
        {
            "message": serialize_message(message),
            "status": "success",
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

    chat = get_chat(chat_id)

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

    # -----------------------------------------------------
    # Pagination
    # -----------------------------------------------------

    try:
        page = int(
            request.GET.get(
                "page",
                1
            )
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
            request.GET.get(
                "limit",
                DEFAULT_MESSAGE_LIMIT
            )
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

    limit = min(
        limit,
        MAX_MESSAGE_LIMIT
    )

    # -----------------------------------------------------
    # Messages query
    # -----------------------------------------------------

    messages = (
        Message.objects
        .filter(
            chat=chat,
            is_deleted = False,
        )
        .select_related(
            "sender",
            "chat",
            "reply_to",
            "reply_to__sender",
        )
        .prefetch_related(
            "attachments",
            "reads__user",
        )
        .order_by(
            "-created_at"
        )
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

        message_data = serialize_message(
            message
        )

        message_data["read_by"] = [
            serialize_message_read(read)
            for read in message.reads.all()
        ]

        data.append(
            message_data
        )

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
            "status": "success",
        }
    )


# =========================================================
# Edit Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["PATCH"])
def edit_message(
    request,
    message_id
):

    message = (
        Message.objects
        .select_related(
            "sender",
            "chat",
        )
        .prefetch_related(
            "attachments",
        )
        .filter(
            id=message_id
        )
        .first()
    )

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

    if len(content) > MAX_MESSAGE_LENGTH:
        return JsonResponse(
            {
                "error": (
                    "content must not exceed "
                    f"{MAX_MESSAGE_LENGTH} characters"
                )
            },
            status=400
        )

    message.content = content
    message.is_edited = True

    message.save(
        update_fields=[
            "content",
            "is_edited",
            "updated_at",
        ]
    )

    return JsonResponse(
        {
            "message": serialize_message(message),
            "status": "success",
        }
    )


# =========================================================
# Delete Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def delete_message(
    request,
    message_id
):

    message = (
        Message.objects
        .select_related(
            "chat",
        )
        .filter(
            id=message_id
        )
        .first()
    )

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
            "updated_at",
        ]
    )

    return JsonResponse(
        {
            "message": "Message deleted successfully",
            "status": "success",
        }
    )


# =========================================================
# Forward Message
# =========================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def forward_message(
    request,
    message_id
):

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

    # -----------------------------------------------------
    # Source message
    # -----------------------------------------------------

    message = (
        Message.objects
        .select_related(
            "chat",
            "sender",
        )
        .prefetch_related(
            "attachments",
        )
        .filter(
            id=message_id
        )
        .first()
    )

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
                "error": "You are not a member of the source chat"
            },
            status=403
        )

    if message.is_deleted:
        return JsonResponse(
            {
                "error": "Deleted messages cannot be forwarded"
            },
            status=400
        )

    # -----------------------------------------------------
    # Target chat
    # -----------------------------------------------------

    target_chat = get_chat(
        target_chat_id
    )

    if not target_chat:
        return JsonResponse(
            {
                "error": "Target chat not found"
            },
            status=404
        )

    if not is_chat_member(
        target_chat,
        request.user
    ):
        return JsonResponse(
            {
                "error": (
                    "You are not a member "
                    "of the target chat"
                )
            },
            status=403
        )

    # -----------------------------------------------------
    # Forward
    # -----------------------------------------------------

    with transaction.atomic():

        forwarded_message = Message.objects.create(
            chat=target_chat,
            sender=request.user,
            content=message.content,
        )

        attachments = [
            Attachment(
                message=forwarded_message,
                file=attachment.file.name,
                file_type=attachment.file_type,
            )
            for attachment in message.attachments.all()
        ]

        if attachments:
            Attachment.objects.bulk_create(
                attachments
            )

    forwarded_message = (
        Message.objects
        .select_related(
            "sender",
            "chat",
            "reply_to",
            "reply_to__sender",
        )
        .prefetch_related(
            "attachments",
        )
        .get(
            id=forwarded_message.id
        )
    )

    return JsonResponse(
        {
            "message": serialize_message(
                forwarded_message
            ),
            "status": "success",
        },
        status=201
    )


# =========================================================
# Search Messages
# =========================================================

@require_auth
@require_http_methods(["GET"])
def search_messages(request):

    query = request.GET.get(
        "q",
        ""
    ).strip()

    chat_id = request.GET.get(
        "chat"
    )

    if not query:
        return JsonResponse(
            {
                "error": "q is required"
            },
            status=400
        )

    if len(query) > MAX_SEARCH_LENGTH:
        return JsonResponse(
            {
                "error": (
                    "q must not exceed "
                    f"{MAX_SEARCH_LENGTH} characters"
                )
            },
            status=400
        )

    messages = (
        Message.objects
        .filter(
            content__icontains=query,
            is_deleted=False,
            chat__memberships__user=request.user,
        )
        .select_related(
            "sender",
            "chat",
            "reply_to",
            "reply_to__sender",
        )
        .prefetch_related(
            "attachments",
            "reply_to__attachments",
        )
        .order_by(
            "-created_at"
        )
    )

    # -----------------------------------------------------
    # Optional chat filter
    # -----------------------------------------------------

    if chat_id is not None:

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

        chat = get_chat(
            chat_id
        )

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

        messages = messages.filter(
            chat_id=chat_id
        )

    messages = messages[:MAX_SEARCH_RESULTS]

    data = [
        serialize_message(message)
        for message in messages
    ]

    return JsonResponse(
        {
            "messages": data,
            "query": query,
            "count": len(data),
            "status": "success",
        }
    )


# =========================================================
# Mark Message As Read
# =========================================================

@require_auth
@require_http_methods(["POST"])
def mark_message_read(
    request,
    message_id
):

    message = (
        Message.objects
        .select_related(
            "chat"
        )
        .filter(
            id=message_id
        )
        .first()
    )

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

    read, created = (
        MessageRead.objects.update_or_create(
            message=message,
            user=request.user,
            defaults={
                "read_at": timezone.now()
            }
        )
    )

    return JsonResponse(
        {
            "message_id": message.id,
            "read": True,
            "read_at": read.read_at,
            "status": "success",
        },
        status=201 if created else 200
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

    message = (
        Message.objects
        .select_related(
            "chat"
        )
        .filter(
            id=message_id
        )
        .first()
    )

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

    if message.is_deleted:
        return JsonResponse(
            {
                "error": (
                    "Cannot add attachments "
                    "to a deleted message"
                )
            },
            status=400
        )

    uploaded_file = request.FILES.get(
        "file"
    )

    file_type = request.POST.get(
        "file_type"
    )

    if not uploaded_file:
        return JsonResponse(
            {
                "error": "file is required"
            },
            status=400
        )

    if file_type not in ALLOWED_FILE_TYPES:
        return JsonResponse(
            {
                "error": (
                    "file_type must be image, "
                    "video, audio or file"
                )
            },
            status=400
        )

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
        file_type=file_type,
    )

    return JsonResponse(
        {
            "attachment": {
                "id": attachment.id,
                "file": attachment.file.url,
                "file_type": attachment.file_type,
                "created_at": attachment.created_at,
            },
            "status": "success",
        },
        status=201
    )