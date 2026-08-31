from django.urls import path
from . import views

urlpatterns = [
    path ("hello/", views.hello),
    path ("message/", views.receive_message ),
    path ("messages/", views.get_messages ),
    path ("register/", views.register),
    path("login/", views.user_login),
    path("me/", views.me),
    path("csrf/", views.csrf_token),
    path("logout/", views.user_logout)
]