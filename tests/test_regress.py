import os
import time
from datetime import datetime
from urllib.parse import parse_qs, urlparse

import pytest
from selenium.common.exceptions import StaleElementReferenceException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from base_page import BasePage

skip = pytest.mark.skip

host = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")


def test_pagination_in_volunteer_list(browser):
    link = f"{host}/login"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    time.sleep(1)
    page.login_admin()
    time.sleep(1)
    page.pagination()
    active_page = browser.find_element(By.CLASS_NAME, "ant-pagination-item-active")
    time.sleep(1)
    assert "2" in active_page.text, "Ошибка: Страница 2 не активна или текст отсутствует!"


def test_pagination_in_feed_history(browser):
    link = f"{host}/feed-transaction"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    time.sleep(1)
    page.meal_history_pagination()
    active_page = browser.find_element(By.CLASS_NAME, "ant-pagination-item-active")
    time.sleep(1)
    assert "2" in active_page.text, "Ошибка: Страница 2 не активна или текст отсутствует!"


def test_create_new_meal(browser):
    link = f"{host}/feed-transaction"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    page.go_to_create_new_meal()
    page.create_new_meal()
    today_date = datetime.now().strftime("%d/%m/%y")
    meal_dates = []

    def meal_with_today_date_present(driver):
        nonlocal meal_dates
        try:
            meal_dates = [
                cell.text for cell in driver.find_elements(By.CSS_SELECTOR, "tbody.ant-table-tbody tr td:first-child")
            ]
            return any(today_date in cell for cell in meal_dates)
        except StaleElementReferenceException:
            return False

    try:
        WebDriverWait(browser, 12).until(meal_with_today_date_present)
    except TimeoutException:
        pass

    parsed = urlparse(browser.current_url)
    params = parse_qs(parsed.query)
    assert parsed.path == "/feed-transaction"
    assert params.get("pageSize", [None])[0] == "10"
    current_value = params.get("current", [None])[0] or params.get("currentPage", [None])[0]
    assert current_value == "1"
    assert any(today_date in cell for cell in meal_dates), f"Ошибка! Ожидали дату {today_date}, но в таблице: {meal_dates}"


@skip()
def test_delete_created_new_meal(browser):
    link = f"{host}/feed-transaction"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    time.sleep(2)
    page.meal_deleting()
    time.sleep(1)
    assert 1 == 1


@skip()
def test_create_group_badge(browser):
    link = f"{host}/group-badges"
    page = BasePage(browser, link)
    page.open()
    time.sleep(1)
    page.first_window()
    page.login_admin()
    time.sleep(2)
    a = page.badges_counter()
    time.sleep(1)
    page.go_to_create_badge()
    time.sleep(1)
    page.create_badge()
    time.sleep(1)
    b = page.badges_counter()
    assert browser.current_url == f"{host}/group-badges"
    assert a + 1 == b


@skip()
def test_delete_group_badge(browser):
    link = f"{host}/group-badges"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    time.sleep(2)
    pagination_items = browser.find_elements(By.CLASS_NAME, "ant-pagination-item")
    pagination_items[-1].click()
    time.sleep(1)
    last_row = browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row")[-1]
    columns = last_row.find_elements(By.CSS_SELECTOR, "td")
    column1 = columns[1].text
    if "autotest" in column1:
        counter1 = page.receive_badges_count()
        page.delete_group_badge()
        counter2 = page.receive_badges_count()
        assert 1 == 1
        assert counter1 != counter2
    else:
        assert 1 == 1


@skip()
def test_create_custom_field(browser):
    link = f"{host}/volunteers"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    time.sleep(1)
    page.go_to_custom_field_creating()
    time.sleep(1)
    rows_before = len(browser.find_elements(By.CSS_SELECTOR, "span.ant-btn-icon"))
    page.go_to_custom_field_creating_2()
    page.create_custom_field()
    time.sleep(1)
    rows_after = len(browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row"))
    last_row = browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row")[-1]
    columns = last_row.find_elements(By.CSS_SELECTOR, "td")
    column1 = columns[0].text
    column2 = columns[1].text
    assert "user" in column1, "Название поля не совпадает!"
    assert "string" in column2, "Тип поля не совпадает!"
    assert int(rows_before) - 4 == rows_after, "число записей изменилось не на 1!"


def test_delete_created_custom_field(browser):
    link = f"{host}/volunteer-custom-fields?sorters[0][field]=id&sorters[0][order]=asc"
    page = BasePage(browser, link)
    page.open()
    page.first_window()
    page.login_admin()
    time.sleep(2)
    last_row = browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row")[-1]
    columns = last_row.find_elements(By.CSS_SELECTOR, "td")
    column1 = columns[0].text
    if "user" in column1:
        page.delete_row()
        assert 1 == 1
    else:
        assert 1 == 1


@skip()
def test_add_and_delete_volunteer_from_group_badge(browser):
    link = f"{host}/group-badges"
    page = BasePage(browser, link)
    page.open()
    time.sleep(1)
    page.first_window()
    page.login_admin()
    page.go_to_edit_badge()
    time.sleep(2)
    count1 = page.receive_count_of_volunteers_in_group_badge()
    page.add_volunteer_in_group_badge()
    time.sleep(1)
    count2 = page.receive_count_of_volunteers_in_group_badge()
    page.save_in_group_badge()
    time.sleep(1)
    page.go_to_edit_badge()
    time.sleep(1)
    count3 = page.receive_count_of_volunteers_in_group_badge()
    time.sleep(1)
    page.delete_volunteer_from_group_badge()
    count4 = page.receive_count_of_volunteers_in_group_badge()
    page.save_in_group_badge()
    time.sleep(3)
    assert browser.current_url == f"{host}/group-badges"
    assert count1 == count4
    assert count2 == count3


@skip()
def test_create_new_user(browser):
    link = f"{host}/volunteers"
    page = BasePage(browser, link)
    page.open()
    time.sleep(1)
    page.first_window()
    page.login_admin()
    time.sleep(3)
    counter1 = page.receive_volunteers_count()
    page.go_to_create_user()
    time.sleep(1)
    page.create_user()
    time.sleep(1)
    page.save_in_user_page()
    time.sleep(3)
    counter2 = page.receive_volunteers_count()
    page.find_user()
    user_name = page.check_username_after_editing()
    assert browser.current_url == f"{host}/volunteers"
    assert counter1 + 1 == counter2, "Счетчик не увеличился на 1!!!"
    assert user_name == "Test_name"


@skip()
def test_edit_new_user(browser):
    link = f"{host}/volunteers"
    page = BasePage(browser, link)
    page.open()
    time.sleep(1)
    page.first_window()
    page.login_admin()
    time.sleep(3)
    counter1 = page.receive_volunteers_count()
    page.find_user()
    page.open_user()
    page.edit_user()
    time.sleep(3)
    user_name = page.check_username_after_editing()
    page.clear_input_field()
    time.sleep(3)
    counter2 = page.receive_volunteers_count()
    assert browser.current_url == f"{host}/volunteers"
    assert counter1 == counter2, "Счетчик изменился!!!"
    assert user_name == "Test_updated_name"


@skip()
def test_delete_new_user(browser):
    link = f"{host}/volunteers"
    page = BasePage(browser, link)
    page.open()
    time.sleep(1)
    page.first_window()
    page.login_admin()
    time.sleep(3)
    counter1 = page.receive_volunteers_count()
    page.find_user()
    page.open_user()
    page.delete_user()
    time.sleep(3)
    page.clear_input_field()
    time.sleep(3)
    counter2 = page.receive_volunteers_count()
    page.check_username_after_deleting()
    counter3 = page.receive_volunteers_count()
    assert browser.current_url.startswith(f"{host}/volunteers")
    assert counter1 == counter2 + 1, "Счетчик не уменьшился на 1!!!"
    assert counter3 == 0


@skip()
def test_scan_qr(browser):
    link = f"{host}/volunteers"
    page = BasePage(browser, link)
    page.open()
    time.sleep(2)
    page.first_window_qr()
    time.sleep(2)
    page.scan_user()
    time.sleep(2)
    assert browser.current_url == f"{host}/volunteers"
