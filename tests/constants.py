import os
from urllib.parse import urlparse

FRONTEND_URL = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")

# Для локальной разработки (localhost/127.0.0.1) API бэкенд работает на порту 8000
# Для staging/prod API и фронт на одном домене
parsed = urlparse(FRONTEND_URL)
if parsed.hostname in ("localhost", "127.0.0.1"):
    API_URL = f"{parsed.scheme}://{parsed.hostname}:8000"
else:
    API_URL = FRONTEND_URL

API_PREFIX = "/feedapi/v1"
API_TIMEOUT = 30

ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "Kolombina25"

DIRECTION_HEAD_ROLE = "DIRECTION_HEAD"

# Для тестовых данных
def get_test_data():
    import time
    timestamp = str(int(time.time()))
    return {
        "username": f"TestUser_{timestamp}",
        "updated_username": f"TestUser_{timestamp}_updated",
        "approver": "Test Approver",
        "supervisor": "Test Supervisor",
        "qr_code": f"qr{timestamp}",
    }
