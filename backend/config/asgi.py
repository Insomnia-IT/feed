"""
ASGI config for feeder project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from config.otel_config import configure_opentelemetry

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
configure_opentelemetry()

application = get_asgi_application()
