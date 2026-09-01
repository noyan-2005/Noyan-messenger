from django.urls import path

from . import views


urlpatterns = [

    # General
    path(
        "hello/",
        views.hello
    ),

    path(
        "csrf/",
        views.csrf_token
    ),

    # Authentication
    path(
        "register/",
        views.register
    ),

    path(
        "login/",
        views.user_login
    ),

    path(
        "logout/",
        views.user_logout
    ),

    path(
        "me/",
        views.me
    ),

    # Users
    path(
        "users/search/",
        views.search_users
    ),

    # Chats
    path(
        "chats/",
        views.get_chats
    ),
    
    
    path(
        "chats/private/",
        views.create_private_chat
    ),

    path(
        "chats/create/",
        views.create_chat
    ),

    path(
        "chats/add-member/",
        views.add_chat_member
    ),

    path(
        "chats/<int:chat_id>/",
        views.get_chat_detail
    ),

    path(
        "chats/<int:chat_id>/members/",
        views.get_chat_members
    ),

    path(
        "chats/<int:chat_id>/members/<int:user_id>/",
        views.remove_chat_member
    ),

    path(
        "chats/<int:chat_id>/leave/",
        views.leave_chat
    ),

    # Messages
    path(
        "message/",
        views.receive_message
    ),

    path(
        "messages/",
        views.get_messages
    ),

    path(
        "messages/<int:message_id>/",
        views.edit_message
    ),

    path(
        "messages/<int:message_id>/delete/",
        views.delete_message
    ),

    # Attachments
    path(
        "messages/<int:message_id>/attachments/",
        views.upload_attachment
    ),
]