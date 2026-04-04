#import os

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
