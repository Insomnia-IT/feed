import os
from datetime import datetime
from base_page import BasePage

host = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")

def test_pagination_in_volunteer_list(page):
    #переход с 1 на 2 страницу пагинации в списке волонтеров
    link=f"{host}/login"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.pagination()
    active_page = login_page.page.locator(".ant-pagination-item-active")
    # проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.inner_text(), "Ошибка: Страница 2 не активна или текст отсутствует!"

