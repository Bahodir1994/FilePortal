


Install django_private_chat2:

pip install django_private_chat2
Add it to your INSTALLED_APPS:

INSTALLED_APPS = (
    ...
    'django_private_chat2.apps.DjangoPrivateChat2Config',
    ...
)
Add django_private_chat2's URL patterns:

from django_private_chat2 import urls as django_private_chat2_urls


urlpatterns = [
    ...
    url(r'^', include(django_private_chat2_urls)),
    ...
]
Add django_private_chat2's websocket URLs to your asgi.py:

django_asgi_app = get_asgi_application()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django_private_chat2 import urls
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(urls.websocket_urlpatterns)
    ),
})
_____________________________________________________________________________________________
Installation
To install pinax-messages:

    $ pip install pinax-messages
Add pinax.messages to your INSTALLED_APPS setting:

INSTALLED_APPS = [
    # other apps
    "pinax.messages",
]
Run Django migrations to create pinax-messages database tables:

    $ python manage.py migrate
Add pinax.messages.urls to your project urlpatterns:

    urlpatterns = [
        # other urls
        url(r"^messages/", include("pinax.messages.urls", namespace="pinax_messages")),
    ]