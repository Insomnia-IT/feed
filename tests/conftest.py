import os
import pytest
from pathlib import Path
from base_page import BasePage

url = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")

STORAGE_STATE_PATH = Path("admin.json")

# Добавляем аргумент командной строки
def pytest_addoption(parser):
    parser.addoption(
        "--language", action="store", default="en"
    )
    # parser.addoption(
    #     "--host", action="store", default="https://feedapp-dev.insomniafest.ru",
    #     help="Base URL for the application under test"
    # )


# Фикстура для получения значения аргумента
@pytest.fixture
def language(request):
    return request.config.getoption("--language")


# @pytest.fixture
# def base_url():
#     """Base URL for the application under test"""
#     return url
#     # return request.config.getoption("--host")


# @pytest.fixture
# def logged_in_page(page):
#     """Fixture that provides a logged-in BasePage instance"""
#     login_page = BasePage(page, f"{url}/login")
#     login_page.open()
#     login_page.first_window()
#     login_page.login_admin()
#     login_page.page.wait_for_timeout(1000)
#     return login_page


@pytest.fixture
def test_credentials():
    """Test credentials for admin user"""
    return {
        "username": "admin",
        "password": "Kolombina25"
    }


@pytest.fixture
def test_user_data():
    """Generate unique test user data"""
    import time
    timestamp = str(int(time.time()))
    return {
        "username": f"TestUser_{timestamp}",
        "updated_username": f"TestUser_{timestamp}_updated",
        "approver": "Test Approver",
        "supervisor": "Test Supervisor",
        "qr_code": f"qr{timestamp}",
        "qr_code_cinnamon": "a0eb3e07fa724dca80a060891afcb53b",
        "qr_code_teamlead": "a0eb3e07fa724dca80a060891afcb53b"
    }


@pytest.fixture(scope="session", autouse=True)
def setup_auth_once(browser):
    """
    Выполняется ОДИН раз перед всеми тестами.
    Создаёт файл admin.json если его нет.
    """
    
    if STORAGE_STATE_PATH.exists():
        print(f"\n[setup] Используем существующую авторизацию: {STORAGE_STATE_PATH}")
        return
    
    print(f"\n[setup] Создаём новую авторизацию...")
    
    # Создаём временный контекст ТОЛЬКО для логина
    context = browser.new_context()
    page = context.new_page()
    
    login_page = BasePage(page, f"{url}/login")
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.page.wait_for_timeout(1000)
    
    # Сохраняем куки и localStorage в файл
    context.storage_state(path=STORAGE_STATE_PATH)
    print(f"[setup] Авторизация сохранена в {STORAGE_STATE_PATH}")
    
    context.close()

@pytest.fixture
def logged_in_page(browser):
    """
    Для КАЖДОГО теста создаём новый контекст,
    но с уже готовой авторизацией (из файла).
    """
    # Новый контекст + загрузка сохранённого состояния
    context = browser.new_context(storage_state=STORAGE_STATE_PATH)
    page = context.new_page()
    
    base_page = BasePage(page, url)
    yield base_page
    
    # Очистка после теста
    context.close()