import os
import time
from selenium.webdriver.common.by import By
from datetime import datetime

# from main_page import MainPage
from base_page import BasePage

host = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")

def test_pagination_in_volunteer_list(browser):
    #переход с 1 на 2 страницу пагинации в списке волонтеров
    link=f"{host}/login"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    time.sleep(1)
    page.login_admin()
    time.sleep(1)
    page.pagination()
    active_page = browser.find_element(By.CLASS_NAME, "ant-pagination-item-active")
    time.sleep(1)
    # проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.text, "Ошибка: Страница 2 не активна или текст отсутствует!"

