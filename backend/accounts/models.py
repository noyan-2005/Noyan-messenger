from django.db import models
from django.contrib.auth.models import User


class Chat(models.Model):

    CHAT_TYPES = [
        ("private", "Private"),
        ("group", "Group"),
    ]

    type = models.CharField(
        max_length=20,
        choices=CHAT_TYPES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

class ChatMember(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
    ]

    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="memberships"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="chat_memberships"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member"
    )

    joined_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "chat"],
                name="unique_user_chat"
            )
        ]
class Message(models.Model):

    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    is_edited = models.BooleanField(
        default=False
    )

    is_deleted = models.BooleanField(
        default=False
    )
    
    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies"
    )


class Attachment(models.Model):

    FILE_TYPES = [
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("file", "File"),
    ]

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    file = models.FileField(
        upload_to="attachments/"
    )

    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )