from django.contrib.auth.models import User
from django.db import models


class Chat(models.Model):

    CHAT_TYPES = [
        ("private", "Private"),
        ("group", "Group"),
    ]

    type = models.CharField(
        max_length=20,
        choices=CHAT_TYPES,
    )

    name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        indexes = [
            models.Index(
                fields=["type", "-created_at"]
            ),
        ]

    def __str__(self):
        return self.name or f"Chat {self.id}"


class ChatMember(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
    ]

    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="chat_memberships",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member",
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "chat"],
                name="unique_user_chat",
            ),
        ]

        indexes = [
            models.Index(
                fields=["user", "-joined_at"]
            ),
            models.Index(
                fields=["chat", "role"]
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.chat_id}"


class Message(models.Model):

    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    is_edited = models.BooleanField(
        default=False,
    )

    is_deleted = models.BooleanField(
        default=False,
    )

    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["chat", "-created_at"]
            ),
            models.Index(
                fields=["sender", "-created_at"]
            ),
            models.Index(
                fields=["chat", "is_deleted", "-created_at"]
            ),
        ]

    def __str__(self):
        return f"Message {self.id} in Chat {self.chat_id}"


class MessageRead(models.Model):

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reads",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="message_reads",
    )

    read_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user"],
                name="unique_message_read",
            ),
        ]

        indexes = [
            models.Index(
                fields=["user", "message"]
            ),
            models.Index(
                fields=["message", "-read_at"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.username} "
            f"read message {self.message.id}"
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
        related_name="attachments",
    )

    file = models.FileField(
        upload_to="attachments/",
    )

    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPES,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        indexes = [
            models.Index(
                fields=["message", "-created_at"]
            ),
        ]

    def __str__(self):
        return f"Attachment {self.id} - {self.file_type}"