from django.contrib import admin

from .models import Chat, ChatMember, Message, Attachment

admin.site.register(Chat)
admin.site.register(ChatMember)
admin.site.register(Attachment)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "chat",
        "sender",
        "content",
        "created_at",
        "updated_at",
        "is_edited",
    )