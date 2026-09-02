from django.urls import path

from . import views


urlpatterns = [

    # =====================================================
    # General
    # =====================================================

    path(
        "hello/",
        views.hello,
        name="hello",
    ),

    path(
        "csrf/",
        views.csrf_token,
        name="csrf-token",
    ),

    # =====================================================
    # Authentication
    # =====================================================

    path(
        "register/",
        views.register,
        name="register",
    ),

    path(
        "login/",
        views.user_login,
        name="login",
    ),

    path(
        "logout/",
        views.user_logout,
        name="logout",
    ),

    path(
        "me/",
        views.me,
        name="me",
    ),

    # =====================================================
    # Users
    # =====================================================

    path(
        "users/search/",
        views.search_users,
        name="search-users",
    ),

    # =====================================================
    # Chats
    # =====================================================

    path(
        "chats/",
        views.get_chats,
        name="get-chats",
    ),

    path(
        "chats/private/",
        views.create_private_chat,
        name="create-private-chat",
    ),

    path(
        "chats/create/",
        views.create_chat,
        name="create-chat",
    ),

    path(
        "chats/add-member/",
        views.add_chat_member,
        name="add-chat-member",
    ),

    path(
        "chats/<int:chat_id>/",
        views.get_chat_detail,
        name="chat-detail",
    ),

    path(
        "chats/<int:chat_id>/members/",
        views.get_chat_members,
        name="chat-members",
    ),

    path(
        "chats/<int:chat_id>/members/<int:user_id>/",
        views.remove_chat_member,
        name="remove-chat-member",
    ),

    path(
        "chats/<int:chat_id>/leave/",
        views.leave_chat,
        name="leave-chat",
    ),

    # =====================================================
    # Messages
    # =====================================================

    path(
        "message/",
        views.receive_message,
        name="send-message",
    ),

    path(
        "messages/",
        views.get_messages,
        name="get-messages",
    ),

    path(
        "messages/search/",
        views.search_messages,
        name="search-messages",
    ),

    path(
        "messages/<int:message_id>/",
        views.edit_message,
        name="edit-message",
    ),

    path(
        "messages/<int:message_id>/delete/",
        views.delete_message,
        name="delete-message",
    ),

    path(
        "messages/<int:message_id>/forward/",
        views.forward_message,
        name="forward-message",
    ),

    path(
        "messages/<int:message_id>/read/",
        views.mark_message_read,
        name="mark-message-read",
    ),

    # =====================================================
    # Attachments
    # =====================================================

    path(
        "messages/<int:message_id>/attachments/",
        views.upload_attachment,
        name="upload-attachment",
    ),
]