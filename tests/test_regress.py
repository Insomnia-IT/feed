import os
import sys
import time
import pytest
from datetime import datetime

# Добавляем папку tests в sys.path, чтобы pytest мог находить локаторы и базовые страницы
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from base_page import BasePage
from locators import *

skip = pytest.mark.skip

host = os.getenv("FEED_APP_HOST", "https://feedapp-dev.insomniafest.ru")
created_user_name = "Test_name"

def test_pagination_in_volunteer_list(page):
    #переход с 1 на 2 страницу пагинации в списке волонтеров
    link = f"{host}/login"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.pagination()
    active_page = login_page.page.locator(".ant-pagination-item-active")
    # проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.inner_text(), "Ошибка: Страница 2 не активна или текст отсутствует!"

def test_pagination_in_feed_history(page):
    #переход с 1 на 2 страницу пагинации в истории питания.
    link = f"{host}/feed-transaction"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.meal_history_pagination()
    active_page = login_page.page.locator(".ant-pagination-item-active")
    #проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.inner_text(), "Ошибка: Страница 2 не активна или текст отсутствует!"


def test_create_new_meal(page):
    # создаем прием пищи, сверяем редирект на урл после сохранения и что дата крайней записи - сегодня
    link = f"{host}/feed-transaction"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.go_to_create_new_meal()
    login_page.create_new_meal()
    first_row_text = login_page.meal_table()
    today_date = datetime.now().strftime("%d/%m/%y")
    # приверка урла
    assert page.url == f"{host}/feed-transaction?pageSize=10&current=1"
    # приверка даты посреднего созданного приема пищи. Примечание - не сработает, если сегодня кормили руками.
    assert  today_date in first_row_text, f"Ошибка! Ожидали сегодняшнюю дату, а получили {first_row_text}"
    print("✅ Запись успешно создана!")

@skip()
def test_delete_created_new_meal(page):
    # не тест, вспомогательная функция для удаления созданного выше приема пищи.
    link = f"{host}/feed-transaction"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.open_meal()
    login_page.meal_deleting()
    # Не мусорим, удаляем созданную запись, ассерт для инфо
    assert 1==1
    print("🗑 Запись успешно удалена!")

def test_create_group_badge(page):
    # создаем вручную групповой бейдж и проверяем счетчик бейджей
    link = f"{host}/group-badges"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    # Ждем пока счетчик загрузится с сервера (после логина он появляется с задержкой)
    page.locator("li.ant-pagination-total-text").wait_for(state="visible")
    a = login_page.badges_counter()
    print("a =", a)
    login_page.go_to_create_badge()
    login_page.create_badge()
    # Ждем редирект обратно на список бейджей после сохранения
    login_page.wait_for_path("/group-badges", timeout=10000)
    # Ждем появления счетчика на странице
    page.locator("li.ant-pagination-total-text").wait_for(state="visible")
    b = login_page.badges_counter()
    print("b =", b)
    assert page.url.startswith(f"{host}/group-badges")
    assert a+1 == b
    print("✅ Бейдж успешно создан! Счетчик увеличился на 1!")

def test_delete_group_badge(page):
    # не тест, вспомогательная функция для удаления созданного выше приема пищи.
    link = f"{host}/group-badges"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    pagination_items = login_page.page.locator(".ant-pagination-item")
    if pagination_items.count() > 0:
        pagination_items.last.click()
    last_row = login_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(1).inner_text()
    # если тестовое имя не найдено, ничего удалять не нужно
    if "autotest" in column1:
        counter1 = login_page.receive_badges_count()
        login_page.delete_group_badge()
        counter2 = login_page.receive_badges_count()
        assert 1==1
        assert counter1 != counter2
        print("Бейдж удален!")
    else:
        assert 1==1
        print("Нечего удалять!")

def test_create_custom_field(page):
    # создание нового кастомного поля
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    login_page.go_to_custom_field_creating()
    login_page.page.locator("tr.ant-table-row").first.wait_for(state="attached")
    # считаем число строк до создания кастомного поля
    rows_before = login_page.page.locator("span.ant-btn-icon").count()
    login_page.go_to_custom_field_creating_2()
    login_page.create_custom_field()
    # задаем поиск по последней строке
    last_row = login_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(0).inner_text()
    column2 = columns.nth(1).inner_text()
    #считаем число строк после создания кастомного поля
    rows_after = login_page.page.locator("tr.ant-table-row").count()
    # сверяем, что последняя запись - наша по 2 признакам и что счетчик числа полей изменился на 1
    assert "user" in column1, "Название поля не совпадает!"
    assert "string" in column2, "Тип поля не совпадает!"
    assert int(rows_before)-4==rows_after, "число записей изменилось не на 1!"
    #в выпадашке списка колонок 5 неподходящих элементов. Вычесть 4 - получим исходный список + 1 созданный

def test_delete_created_custom_field(page):
    link = f"{host}/volunteer-custom-fields?sorters[0][field]=id&sorters[0][order]=asc"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    last_row = login_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(0).inner_text()
    if "user" in column1:
        login_page.delete_row()
        assert 1==1
        print("Запись удалена!")
    else:
        assert 1==1
        print("Нечего удалять!")


def test_add_and_delete_volunteer_from_group_badge(page):
    #добавить, а затем удалить волонтера из группового бейджа
    link = f"{host}/group-badges"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    #идем в редактирование последнего бейджика
    login_page.go_to_edit_badge()
    #фиксируем число на счетчике
    count1 = login_page.receive_count_of_volunteers_in_group_badge()
    #добавляем волонтера
    login_page.add_volunteer_in_group_badge()
    page.wait_for_timeout(1000)
    #фиксируем счетчик и сохраняем
    count2 = login_page.receive_count_of_volunteers_in_group_badge()
    login_page.save_in_group_badge()
    login_page.wait_for_path("/group-badges")
    page.locator("tr.ant-table-row").first.wait_for(state="attached")
    #возвращаемся в бейдж
    login_page.go_to_edit_badge()
    #фиксируем счетчик
    count3 = login_page.receive_count_of_volunteers_in_group_badge()
    #удаляем волонтера
    login_page.delete_volunteer_from_group_badge()
    page.wait_for_timeout(1000)
    #фиксируем счётчик и сохраняем
    count4 = login_page.receive_count_of_volunteers_in_group_badge()
    login_page.save_in_group_badge()
    #в ассертах сверяем возврат на урл групповых бейджей после сохранения и мэтч счётчиков между собой
    login_page.wait_for_path("/group-badges")
    assert page.url.startswith(f"{host}/group-badges")
    print("До-", count1, "человек в бейдже")
    assert count1==count4
    print("До-", count1, count4, "человек в бейдже")
    assert count2==count3
    print("После-", count3, "человек в бейдже")

def test_create_new_user(page):
    #создать нового юзера
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    # перейти на страницу создания нового юзера
    counter1 = login_page.receive_volunteers_count()
    login_page.go_to_create_user()
    global created_user_name
    created_user_name = f"Test_name_{datetime.now().strftime('%d%m%H%M%S')}"
    login_page.create_user(created_user_name)
    login_page.save_in_user_page()
    page.wait_for_url(f"{host}/volunteers")
    page.locator("tr.ant-table-row").first.wait_for(state="attached")
    page.wait_for_timeout(1000)
    counter2 = login_page.receive_volunteers_count()
    login_page.find_user(created_user_name)
    user_name = login_page.check_username_after_editing(created_user_name)
    assert page.url == f"{host}/volunteers"
    assert counter1 + 1 == counter2, "Счетчик не увеличился на 1!!!"
    assert user_name == created_user_name

def test_edit_new_user(page):
    # найти созданного юзера и отредактировать его
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    counter1 = login_page.receive_volunteers_count()
    # перейти на страницу создания нового юзера
    global created_user_name
    login_page.find_user(created_user_name)
    login_page.open_user(created_user_name)
    updated_name = f"{created_user_name}_updated"
    login_page.edit_user(updated_name=updated_name, original_name=created_user_name)
    page.wait_for_url(f"{host}/volunteers")
    page.locator("tr.ant-table-row").first.wait_for(state="attached")
    # Проверяем что имя обновилось, потом сбрасываем фильтр
    user_name = login_page.check_username_after_editing(updated_name)
    login_page.clear_input_field()
    # Ждем пока счетчик вернется к общему (без фильтрации)
    page.wait_for_timeout(1000)
    counter2 = login_page.receive_volunteers_count()
    assert page.url == f"{host}/volunteers"
    assert counter1 == counter2, "Счетчик изменился!!!"
    assert user_name == updated_name


def test_delete_new_user(page):
    # найти созданного юзера и удалить его
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window()
    login_page.login_admin()
    counter1 = login_page.receive_volunteers_count()
    global created_user_name
    updated_name = f"{created_user_name}_updated"
    login_page.find_user(updated_name)
    login_page.open_user(updated_name)
    login_page.delete_user()
    # Ждем возврата на страницу списка после удаления
    page.wait_for_url(f"{host}/volunteers", timeout=5000)
    login_page.clear_input_field()
    # Ждем пока счетчик уменьшится, чтобы не читать старое значение
    expected_count = counter1 - 1
    try:
        page.wait_for_function(
            f'() => parseInt(document.querySelector("span[data-testid=volunteer-count]")?.innerText) === {expected_count}',
            timeout=5000
        )
    except Exception:
        pass
    page.wait_for_timeout(500)
    counter2 = login_page.receive_volunteers_count()
    login_page.check_username_after_deleting(updated_name)
    counter3 = login_page.receive_volunteers_count()
    assert page.url.startswith(f"{host}/volunteers")
    assert counter1 == counter2+1, "Счетчик не уменьшился на 1!!!"
    assert counter3 == 0



def test_scan_qr(page):
    # Открываем страницу логина (через /volunteers она редиректит на логин)
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    # Переходим на таб QR-входа (клик на неактивный таб)
    login_page.first_window_qr()
    # Диспатчим событие сканирования QR-кода
    login_page.scan_user("20635ffe1ad2496f8cfc5668d7e8b34d")
    # Ждем редиректа на основную страницу после входа
    page.wait_for_url(f"{host}/volunteers", timeout=10000)
    # Ждем появления имени пользователя в меню
    user_menu = page.locator("span.ant-menu-title-content").first
    user_menu.wait_for(state="visible")
    # Проверяем что вошли под правильным пользователем (Корица)
    menu_text = user_menu.inner_text()
    assert "Корица" in menu_text, f"Ожидалось 'Корица' в меню, но получили: '{menu_text}'"
    assert page.url == f"{host}/volunteers"
    print(f"QR-вход выполнен успешно! Пользователь: {menu_text}")


def test_teamlead_rights(page):
    # войти по QR руководителя службы
    link = f"{host}/volunteers"
    login_page = BasePage(page, link)
    login_page.open()
    login_page.first_window_qr()
    login_page.scan_user("401d641aa4894a6hf832lsudd1")
    page.wait_for_url(f"{host}/volunteers", timeout=10000)
    # открыть любого волонтера
    login_page.open_user()
    # проверить, что нет кнопки удаления 
    assert login_page.is_not_element_present(None, create_user.DELETE_USER_BUTTON), "Ошибка: Кнопка удаления волонтера видна руководителю службы!"
    # проверить, что поля кухня, право доступа, комментарий бюро - некликабельны
    assert login_page.is_element_disabled(create_user.KITCHEN_FIELD), "Ошибка: Поле кухня кликабельно для руководителя службы!"
    assert login_page.is_element_disabled(create_user.RIGHTS_FIELD), "Ошибка: Поле право доступа кликабельно для руководителя службы!"
    assert login_page.is_element_disabled(create_user.COMMENT_FIELD), "Ошибка: Поле комментарий бюро кликабельно для руководителя службы!"
    # проверить бан
    login_page.ban_user()
    page.wait_for_timeout(5000)
    # проверить разбана
    login_page.unban_user()
    page.wait_for_timeout(5000)
    #сохранить
    login_page.save_in_user_page()
    page.wait_for_url(f"{host}/volunteers", timeout=5000)
    # открыть того же волонтера
    login_page.open_user()
    # проверить две записи в истории действий
    login_page.check_history_actions()
    # последняя запись - разбан
    assert login_page.check_last_action() == "Разблокирован", "Ошибка: Последняя запись в истории действий не разбан!"
    # предпоследняя запись - бан
    assert login_page.check_second_last_action() == "Заблокирован", "Ошибка: Предпоследняя запись в истории действий не бан!"
    print("История действий проверена!")
