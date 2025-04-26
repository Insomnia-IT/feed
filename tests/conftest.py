from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
import os

import pytest

# Добавляем аргумент командной строки
def pytest_addoption(parser):
    parser.addoption(
        "--language", action="store", default="en"
    )

# Фикстура для получения значения аргумента
@pytest.fixture
def language(request):
    return request.config.getoption("--language")


@pytest.fixture
def browser(language):
    options = Options()
    options.add_experimental_option('prefs', {'intl.accept_languages': language})
    if os.environ.get('WEBDRIVER_REMOTE'):
        browser = webdriver.Remote(command_executor='http://chrome:4444/wd/hub', options=options)
    else:
        browser = webdriver.Chrome(options=options)

    yield browser
    browser.quit()
