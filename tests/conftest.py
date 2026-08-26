import json
import os
import time
import pytest
from pathlib import Path
from base_page import BasePage
from api_client import ApiClient
from constants import FRONTEND_URL

url = FRONTEND_URL

STORAGE_STATE_PATH = Path("admin.json")


def _storage_state_is_valid(path: Path) -> bool:
    """Проверяет, что storage_state содержит auth cookie с непустым значением."""
    if not path.exists():
        return False
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return False

    # Ищем cookie с name='auth' и непустым value
    cookies = data.get("cookies", [])
    for cookie in cookies:
        if cookie.get("name") == "auth" and cookie.get("value"):
            return True
    return False


def pytest_addoption(parser):
    parser.addoption("--language", action="store", default="en")


@pytest.fixture
def language(request):
    return request.config.getoption("--language")


@pytest.fixture(scope="session")
def api_client():
    client = ApiClient()
    client.authenticate_admin()
    return client


# ── справочники (неизменяемые, берём из API) ─────────────────────────
@pytest.fixture(scope="session")
def first_direction(api_client):
    directions = api_client.get_directions()
    if not directions:
        pytest.skip("No directions in database")
    return directions[0]


@pytest.fixture(scope="session")
def first_kitchen(api_client):
    kitchens = api_client.get_kitchens()
    if not kitchens:
        pytest.skip("No kitchens in database")
    return kitchens[0]


@pytest.fixture(scope="session")
def first_feed_type(api_client):
    feed_types = api_client.get_feed_types()
    if not feed_types:
        pytest.skip("No feed types in database")
    return feed_types[0]


# ── тестовые данные (генерация) ─────────────────────────────────────
@pytest.fixture
def test_user_data():
    timestamp = str(int(time.time()))
    return {
        "username": f"TestUser_{timestamp}",
        "updated_username": f"TestUser_{timestamp}_updated",
        "approver": "Test Approver",
        "supervisor": "Test Supervisor",
        "qr_code": f"qr{timestamp}",
    }


# ── фикстуры: создание + cleanup тестовых сущностей ──────────────────
@pytest.fixture
def test_volunteer(api_client, first_direction, first_kitchen, first_feed_type):
    """Создаёт волонтера через API, удаляет после теста (даже если упал)."""
    data = {
        "name": f"TestVolunteer_{int(time.time())}",
        "directions": [first_direction["id"]],
        "kitchen": first_kitchen["id"],
        "main_role": 'VOLUNTEER',
        "feed_type": first_feed_type["id"],
        "qr": f"qr0test0{int(time.time())}",
    }
    volunteer = api_client.create_volunteer(data)
    try:
        yield volunteer
    finally:
        api_client.delete_volunteer(volunteer["id"])


@pytest.fixture
def test_direction_head(api_client, first_direction, first_kitchen, first_feed_type):
    """Создаёт волонтера с правами DIRECTION_HEAD."""
    from constants import DIRECTION_HEAD_ROLE
    data = {
        "name": f"TestDirHead_{int(time.time())}",
        "access_role": DIRECTION_HEAD_ROLE,
        "directions": [first_direction["id"]],
        "kitchen": first_kitchen["id"],
        "main_role": 'TEAM_LEAD',
        "feed_type": first_feed_type["id"],
        "qr": f"qr0head0{int(time.time())}",
    }

    volunteer = api_client.create_volunteer(data)
    try:
        yield volunteer
    finally:
        api_client.delete_volunteer(volunteer["id"])


@pytest.fixture
def direction_pair(api_client, first_direction, first_kitchen, first_feed_type):
    """Создаёт пару: руководитель службы + обычный волонтёр в одной службе."""
    from constants import DIRECTION_HEAD_ROLE
    direction_id = first_direction["id"]
    base = {
        "directions": [direction_id],
        "kitchen": first_kitchen["id"],
        "feed_type": first_feed_type["id"],
    }
    head = api_client.create_volunteer(
        {**base, "name": f"TestDirHead_{int(time.time())}", "access_role": DIRECTION_HEAD_ROLE, "main_role": 'TEAM_LEAD', "qr": f"qr0head0{int(time.time())}"}
    )
    subordinate = api_client.create_volunteer(
        {**base, "name": f"TestSubord_{int(time.time())}", "main_role": 'VOLUNTEER', "qr": f"qr0sub0{int(time.time())}"}
    )
    try:
        yield head, subordinate
    finally:
        api_client.delete_volunteer(subordinate["id"])
        api_client.delete_volunteer(head["id"])


@pytest.fixture
def qr_login_volunteer(api_client, first_direction, first_kitchen, first_feed_type):
    """Создаёт волонтера с любой access_role (для QR-входа)."""
    data = {
        "name": f"TestQRUser_{int(time.time())}",
        "directions": [first_direction["id"]],
        "kitchen": first_kitchen["id"],
        "main_role": 'VOLUNTEER',
        "feed_type": first_feed_type["id"],
        "qr": f"qr0login0{int(time.time())}",
    }
    volunteer = api_client.create_volunteer(data)
    try:
        yield volunteer
    finally:
        api_client.delete_volunteer(volunteer["id"])


@pytest.fixture
def test_group_badge(api_client, first_direction, first_kitchen):
    """Создаёт групповой бейдж."""
    data = {
        "name": f"TestBadge_{int(time.time())}",
        "direction": first_direction["id"],
        "kitchen": first_kitchen["id"],
        "role": 'VOLUNTEER',
        "qr": f"qr0badge0{int(time.time())}",
    }
    badge = api_client.create_group_badge(data)
    try:
        yield badge
    finally:
        api_client.delete_group_badge(badge["id"])


@pytest.fixture
def test_custom_field(api_client):
    """Создаёт кастомное поле."""
    data = {
        "name": f"user_field_{int(time.time())}",
        "type": "string",
    }
    field = api_client.create_custom_field(data)
    try:
        yield field
    finally:
        api_client.delete_custom_field(field["id"])


# ── UI-авторизация (admin) ─────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def setup_auth_once(browser, request):
    max_retries = 3
    try:
        retries_opt = getattr(request.config.option, "retries", None)
        if retries_opt is not None:
            max_retries = int(retries_opt)
    except (ValueError, AttributeError):
        pass

    if _storage_state_is_valid(STORAGE_STATE_PATH):
        print(f"\n[setup] Используем существующую авторизацию: {STORAGE_STATE_PATH}")
        return

    for attempt in range(1, max_retries + 1):
        print(f"\n[setup] Попытка авторизации {attempt}/{max_retries}...")
        context = browser.new_context()
        page = context.new_page()

        try:
            login_page = BasePage(page, f"{url}/login")
            login_page.open()
            login_page.first_window()
            login_page.login_admin()
            login_page.page.wait_for_timeout(1000)

            context.storage_state(path=STORAGE_STATE_PATH)

            if _storage_state_is_valid(STORAGE_STATE_PATH):
                print(f"[setup] Авторизация сохранена в {STORAGE_STATE_PATH}")
                context.close()
                return

            print(f"[setup] Авторизация прошла, но storage_state не валиден")
        except Exception as e:
            print(f"[setup] Ошибка при авторизации: {e}")
        finally:
            try:
                context.close()
            except Exception:
                pass

        if attempt < max_retries:
            time.sleep(1)

    pytest.fail(
        f"Не удалось создать валидную авторизацию после {max_retries} попыток. "
        f"Проверьте URL бэкенда и учетные данные админа."
    )


@pytest.fixture
def logged_in_page(browser):
    context = browser.new_context(storage_state=STORAGE_STATE_PATH)
    page = context.new_page()
    base_page = BasePage(page, url)
    yield base_page
    context.close()
