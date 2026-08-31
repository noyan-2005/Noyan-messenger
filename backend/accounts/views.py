from django.shortcuts import render
from django.http import JsonResponse
import json
from .models import Message, Chat, ChatMember
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from .decorators import require_auth
from django.views.decorators.http import require_http_methods
import re


def hello(request):
    
    name = request.GET.get("name")
    
    return JsonResponse({
        "message": f"Hello {name}!",
        "status": "success"
    })

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
        
    content = data.get("content")
    chat_id = data.get("chat")
    
    if not content:
        return JsonResponse(
            {
                "error": "content is required"
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
    is_member = ChatMember.objects.filter(chat=chat, user=sender ).exists()
    
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
    
    chat = Chat.objects.filter(
       id = chat_id 
    ).first()
    
    if not chat :
        return JsonResponse(
            {
                "error" : "Chat not found"
            },
            status = 404
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
        chat=chat_id
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
    
    return JsonResponse(data, safe=False)


# Register

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

    username = data.get("username")
    password = data.get("password")

    # Required fields
    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )

    # Username validation
    if not isinstance(username, str):
        return JsonResponse(
            {
                "error": "username must be a string"
            },
            status=400
        )

    if not re.fullmatch(r"[A-Za-z0-9_]{3,30}", username):
        return JsonResponse(
            {
                "error": "Username must be 3-30 characters and contain only letters, numbers, and underscores"
            },
            status=400
        )

    # Check username availability
    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {
                "error": "username is unavailable"
            },
            status=400
        )

    # Create user
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


# Login

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
    
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return JsonResponse(
            {
                "error": "username and password are required"
            },
            status=400
        )
    
    user = authenticate(
        username=username,
        password=password
    )
    
    if user is None:
        return JsonResponse(
            {
                "error": "Invalid username or password"
            },
            status=401
        )
    
    login(request, user)
    
    return JsonResponse(
        {
            "message": "Login successful",
            "username": user.username
        },
        status=200
    )


# Current user
@require_http_methods(["GET"])
def me(request):
    
    return JsonResponse({
        "username": request.user.username
    })
