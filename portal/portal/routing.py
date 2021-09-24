from django.urls import re_path
import sys
sys.path.append(".")

from . import consumers

websocket_urlpatterns = [
    re_path('/', consumers.ChatConsumer.as_asgi()),
]