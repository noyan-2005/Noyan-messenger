from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Chat(models.Model):
    
    CHAT_TYPES = [
        ("private", "Private"),
        ("group", "Group")
    ]
    
    type = models.CharField( max_length=20 , choices = CHAT_TYPES )
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMember(models.Model):
    chat = models.ForeignKey(
        Chat,
       on_delete= models.CASCADE
    )
    
    user = models.ForeignKey (
        User,
        on_delete = models.CASCADE
    )
    
   # UniqueConstraint

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
        on_delete=models.CASCADE
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_edited = models.BooleanField(default=False)

    def save(self, *args, **kwargs):

        if self.pk:
            old_message = Message.objects.get(pk=self.pk)

        super().save(*args, **kwargs)

class Attachment (models.Model):
    
    FILE_TYPE = [
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("file", "File")
    ]
    message = models.ForeignKey(
        Message,
        on_delete = models.CASCADE,
        related_name = "attachments"
    )
    file = models.FileField( upload_to = "attachments/")
    file_type = models.CharField( max_length = 20 , choices = FILE_TYPE )
    created_at = models.DateTimeField(auto_now_add = True)