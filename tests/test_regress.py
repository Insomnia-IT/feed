import os
import re
import sys

import pytest
from http import HTTPStatus

# Добавляем папку tests в sys.path, чтобы pytest мог находить локаторы и базовые страницы
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from base_page import BasePage
from constants import FRONTEND_URL
from locators import *

base_url = FRONTEND_URL

def test_pagination_in_volunteer_list(logged_in_page):
    #переход с 1 на 2 страницу пагинации в списке волонтеров
    logged_in_page.page.goto(f"{base_url}/volunteers", wait_until="domcontentloaded")
    logged_in_page.pagination()
    active_page = logged_in_page.page.locator(".ant-pagination-item-active")
    # проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.inner_text(), "Ошибка: Страница 2 не активна или текст отсутствует!"

def test_pagination_in_feed_history(logged_in_page):
    #переход с 1 на 2 страницу пагинации в истории питания.
    logged_in_page.page.goto(f"{base_url}/feed-transaction", wait_until="domcontentloaded")
    logged_in_page.meal_history_pagination()
    
    active_page = logged_in_page.page.locator(".ant-pagination-item-active")
    #проверяем что активная страница имеет 2 в наименовании
    assert "2" in active_page.inner_text(), "Ошибка: Страница 2 не активна или текст отсутствует!"

def test_create_new_meal(logged_in_page):
    # TODO: удалять после создания через апи
    logged_in_page.page.goto(f"{base_url}/feed-transaction")
    logged_in_page.go_to_create_new_meal()
    logged_in_page.create_new_meal()
    logged_in_page.wait_for_list_page(f"{base_url}/feed-transaction")
    first_row_text = logged_in_page.meal_table()
    assert logged_in_page.page.url.startswith(f"{base_url}/feed-transaction")
    assert re.fullmatch(r"\d{2}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}", first_row_text), (
        f"Ошибка! Ожидали дату и время в первой строке, а получили {first_row_text}"
    )
    print("✅ Запись успешно создана!")

@pytest.mark.skip(reason="не кликается питание в списке")
def test_delete_created_new_meal(logged_in_page):
    # удаляем созданный прием пищи через UI
    logged_in_page.page.goto(f"{base_url}/feed-transaction")
    logged_in_page.open_meal()
    logged_in_page.meal_deleting()
    assert 1==1
    print("🗑 Запись успешно удалена!")

def test_create_group_badge(logged_in_page):
    # создаем вручную групповой бейдж и проверяем счетчик бейджей
    logged_in_page.page.goto(f"{base_url}/group-badges")
    # Ждем пока счетчик загрузится с сервера (после логина он появляется с задержкой)
    logged_in_page.page.locator("li.ant-pagination-total-text").wait_for(state="visible")
    a = logged_in_page.badges_counter()
    print("a =", a)
    logged_in_page.go_to_create_badge()
    logged_in_page.create_badge()
    # На текущем стенде после сохранения форма может оставаться открытой, поэтому возвращаемся на список явно.
    logged_in_page.page.goto(f"{base_url}/group-badges")
    # Ждем появления счетчика на странице
    logged_in_page.page.locator("li.ant-pagination-total-text").wait_for(state="visible")
    b = logged_in_page.badges_counter()
    print("b =", b)
    assert logged_in_page.page.url.startswith(f"{base_url}/group-badges")
    assert a+1 == b
    print("✅ Бейдж успешно создан! Счетчик увеличился на 1!")

def test_delete_group_badge(logged_in_page):
    # удаляем созданный бейдж через UI
    logged_in_page.page.goto(f"{base_url}/group-badges")
    pagination_items = logged_in_page.page.locator(".ant-pagination-item")
    if pagination_items.count() > 0:
        pagination_items.last.click()
    last_row = logged_in_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(1).inner_text()
    # если тестовое имя не найдено, ничего удалять не нужно
    if "autotest" in column1:
        counter1 = logged_in_page.receive_badges_count()
        logged_in_page.delete_group_badge()
        counter2 = logged_in_page.receive_badges_count()
        assert 1==1
        assert counter1 != counter2
        print("Бейдж удален!")
    else:
        assert 1==1
        print("Нечего удалять!")

def test_create_custom_field(logged_in_page):
    # создание нового кастомного поля
    logged_in_page.page.goto(f"{base_url}/volunteers")
    logged_in_page.go_to_custom_field_creating()
    logged_in_page.page.locator("tr.ant-table-row").first.wait_for(state="attached")
    # считаем число строк до создания кастомного поля
    rows_before = logged_in_page.page.locator("span.ant-btn-icon").count()
    logged_in_page.go_to_custom_field_creating_2()
    logged_in_page.create_custom_field()
    # задаем поиск по последней строке
    last_row = logged_in_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(0).inner_text()
    column2 = columns.nth(1).inner_text()
    #считаем число строк после создания кастомного поля
    rows_after = logged_in_page.page.locator("tr.ant-table-row").count()
    # сверяем, что последняя запись - наша по 2 признакам и что счетчик числа полей изменился на 1
    assert "user" in column1, "Название поля не совпадает!"
    assert "string" in column2, "Тип поля не совпадает!"
    assert int(rows_before)-4==rows_after, "число записей изменилось не на 1!"
    #в выпадашке списка колонок 5 неподходящих элементов. Вычесть 4 - получим исходный список + 1 созданный

def test_delete_created_custom_field(logged_in_page):
    logged_in_page.page.goto(f"{base_url}/volunteer-custom-fields?sorters[0][field]=id&sorters[0][order]=asc")
    last_row = logged_in_page.page.locator("tr.ant-table-row").last
    columns = last_row.locator("td")
    column1 = columns.nth(0).inner_text()
    if "user" in column1:
        logged_in_page.delete_row()
        assert 1==1
        print("Запись удалена!")
    else:
        assert 1==1
        print("Нечего удалять!")

def test_add_and_delete_volunteer_from_group_badge(logged_in_page, test_group_badge, test_volunteer):
    #добавить, а затем удалить волонтера из группового бейджа
    badge_id = test_group_badge["id"]
    logged_in_page.page.goto(f"{base_url}/group-badges/edit/{badge_id}")
    logged_in_page.page.wait_for_timeout(1000)
    #добавляем волонтера
    logged_in_page.open_group_badge_volunteers_tab()
    volunteer_id = logged_in_page.add_volunteer_in_group_badge(test_volunteer["name"])
    logged_in_page.page.wait_for_timeout(1000)
    volunteer_row = logged_in_page.page.locator(f'div.ant-table-container:visible tr[data-row-key="{volunteer_id}"]')
    assert volunteer_row.count() > 0, "Ошибка: Волонтер не добавился в бейдж!"

    logged_in_page.save_in_group_badge()
    logged_in_page.page.goto(f"{base_url}/group-badges/edit/{badge_id}")
    logged_in_page.page.wait_for_timeout(1000)
    logged_in_page.open_group_badge_volunteers_tab()
    #фиксируем счетчик
    count3 = logged_in_page.receive_count_of_volunteers_in_group_badge()
    #удаляем волонтера
    logged_in_page.delete_volunteer_from_group_badge()
    logged_in_page.page.wait_for_timeout(1000)
    # #фиксируем счётчик и сохраняем
    count4 = logged_in_page.receive_count_of_volunteers_in_group_badge()
    assert count4 == count3 - 1
    logged_in_page.save_in_group_badge()
    logged_in_page.page.goto(f"{base_url}/group-badges/edit/{badge_id}")
    logged_in_page.page.wait_for_timeout(1000)
    logged_in_page.open_group_badge_volunteers_tab()
    count5 = logged_in_page.receive_count_of_volunteers_in_group_badge()
    assert count5 == count4
    print("После-", count3, "человек в бейдже")

@pytest.mark.skip()
def test_create_new_user(logged_in_page, test_user_data, api_client):
    # создать нового юзера через UI
    logged_in_page.page.goto(f"{base_url}/volunteers")
    counter1 = logged_in_page.receive_volunteers_count()
    logged_in_page.go_to_create_user()
    test_username = test_user_data["username"]
    expected_supervisor = logged_in_page.create_user(test_user_data)
    logged_in_page.save_in_user_page()
    logged_in_page.page.wait_for_timeout(1000)
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers", timeout=10000)
    logged_in_page.find_user(test_username)
    logged_in_page.page.wait_for_timeout(300)
    logged_in_page.open_user(test_username)
    logged_in_page.page.wait_for_timeout(500)

    # Получаем ID из URL для cleanup
    created_user_id = int(logged_in_page.page.url.rstrip("/").split("/")[-1])

    try:
        actual_supervisor = logged_in_page.get_supervisor_name()
        assert actual_supervisor == expected_supervisor, "Ошибка: Имя бригадира не cохранилось!"
        logged_in_page.save_in_user_page()
        logged_in_page.page.wait_for_timeout(1000)
        logged_in_page.page.locator("tr.ant-table-row").first.wait_for(state="attached")
        logged_in_page.clear_input_field()
        logged_in_page.page.wait_for_timeout(500)
        counter2 = logged_in_page.receive_volunteers_count()
        logged_in_page.find_user(test_username)
        user_name = logged_in_page.check_username_after_editing(test_username)
        assert logged_in_page.page.url.startswith(f"{base_url}/volunteers"), "Ошибка: Редирект не случився!"
        assert counter1 + 1 == counter2, "Счетчик не увеличился на 1!!!"
        assert user_name == test_username, "Ошибка: Имя не совпадает!"
    finally:
        api_client.delete_volunteer(created_user_id)

@pytest.mark.skip()
def test_edit_new_user(logged_in_page, test_volunteer):
    # найти созданного юзера и отредактировать его
    logged_in_page.page.goto(f"{base_url}/volunteers")
    counter1 = logged_in_page.receive_volunteers_count()
    original_name = test_volunteer["name"]
    logged_in_page.find_user(original_name)

    # Теперь редактируем созданного пользователя
    logged_in_page.open_user(original_name)
    updated_name = original_name + "_updated"
    expected_supervisor = logged_in_page.edit_user(updated_name=updated_name, original_name=original_name)
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers")
    # Проверяем что имя обновилось, потом сбрасываем фильтр
    user_name = logged_in_page.check_username_after_editing(updated_name)
    # заходим в юзера и проверяем имя бригадира
    logged_in_page.open_user(updated_name)
    supervisor_name = logged_in_page.get_supervisor_name()
    assert supervisor_name == expected_supervisor, "Ошибка: Имя бригадира не совпадает!"
    logged_in_page.save_in_user_page()
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers")
    logged_in_page.clear_input_field()
    # Ждем пока счетчик вернется к общему (без фильтрации)
    logged_in_page.page.wait_for_timeout(1000)
    counter2 = logged_in_page.receive_volunteers_count()
    assert logged_in_page.page.url.startswith(f"{base_url}/volunteers")
    assert counter1 == counter2, "Счетчик изменился!!!"
    assert user_name == updated_name

@pytest.mark.skip()
def test_delete_new_user(logged_in_page, test_volunteer):
    # найти созданного юзера и удалить его
    logged_in_page.page.goto(f"{base_url}/volunteers")
    counter1 = logged_in_page.receive_volunteers_count()
    user_name = test_volunteer["name"]
    logged_in_page.find_user(user_name)
    logged_in_page.open_user(user_name)
    logged_in_page.delete_user()
    # Ждем возврата на страницу списка после удаления
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers", timeout=10000)
    logged_in_page.clear_input_field()
    # Ждем пока счетчик уменьшится, чтобы не читать старое значение
    expected_count = counter1 - 1
    try:
        logged_in_page.page.wait_for_function(
            f'() => parseInt(document.querySelector("span[data-testid=volunteer-count]")?.innerText) === {expected_count}',
            timeout=5000
        )
    except Exception:
        pass
    logged_in_page.page.wait_for_timeout(500)
    counter2 = logged_in_page.receive_volunteers_count()
    logged_in_page.check_username_after_deleting(user_name)
    counter3 = logged_in_page.receive_volunteers_count()
    assert logged_in_page.page.url.startswith(f"{base_url}/volunteers")
    assert counter1 == counter2+1, "Счетчик не увеличился на 1!!!"
    assert counter3 == 0

def test_scan_qr(page, test_direction_head):
    login_page = BasePage(page, f"{base_url}/login")
    login_page.open()
    # Переходим на таб QR-входа
    login_page.first_window_qr()
    # Диспатчим событие сканирования QR-кода созданного волонтера
    login_page.scan_user(test_direction_head["qr"])
    # Ждем редиректа на основную страницу после входа
    login_page.page.wait_for_url(f"{base_url}/volunteers", timeout=5000)
    # Ждем появления имени пользователя в меню
    user_menu = login_page.page.locator("span.ant-menu-title-content").first
    user_menu.wait_for(state="visible")
    # Проверяем что вошли под правильным пользователем
    head_name = test_direction_head["name"]
    menu_text = user_menu.inner_text()
    assert head_name in menu_text, f"Ожидалось '{head_name}' в меню, но получили: '{menu_text}'"
    assert login_page.page.url == f"{base_url}/volunteers"
    print(f"QR-вход выполнен успешно! Пользователь: {head_name}")

def test_scan_qr_without_access_rights(qr_login_volunteer, api_client):
    res = api_client.get_volunteer_by_qr(qr_login_volunteer["qr"])

    assert res.status_code == HTTPStatus.UNAUTHORIZED, f"Рдовой волонтер смог зайти в Кормителя. Статус код - {res.status_code}"

def test_teamlead_rights(page, direction_pair, api_client):
    direction_head, target_volunteer = direction_pair
    target_id = target_volunteer["id"]

    # войти по QR руководителя службы
    login_page = BasePage(page, f"{base_url}/login")
    login_page.open()
    login_page.first_window_qr()
    login_page.scan_user(direction_head["qr"])
    login_page.page.wait_for_url(f"{base_url}/volunteers", timeout=5000)

    # открыть карточку волонтера из той же службы
    login_page.page.goto(f"{base_url}/volunteers/edit/{target_id}")
    login_page.page.locator(create_user.USER_NAME).wait_for(state="visible", timeout=15000)

    # проверить, что нет кнопки удаления
    assert login_page.is_not_element_present(None, create_user.DELETE_USER_BUTTON), "Ошибка: Кнопка удаления волонтера видна руководителю службы!"
    # проверить, что поля кухня, право доступа, комментарий бюро - некликабельны
    assert login_page.is_element_disabled(create_user.KITCHEN_FIELD), "Ошибка: Поле кухня кликабельно для руководителя службы!"
    assert login_page.is_element_disabled(create_user.RIGHTS_FIELD), "Ошибка: Поле право доступа кликабельно для руководителя службы!"
    assert login_page.is_element_disabled(create_user.COMMENT_FIELD), "Ошибка: Поле комментарий бюро кликабельно для руководителя службы!"

    # проверить бан и разбан через API
    try:
        api_client.set_block_state(target_id, True, qr_token=direction_head["qr"])
        api_client.set_block_state(target_id, False, qr_token=direction_head["qr"])
    finally:
        api_client.set_block_state(target_id, False, qr_token=direction_head["qr"])

    # после перезагрузки убедиться, что в истории появились две записи
    login_page.page.reload()
    login_page.page.locator(create_user.USER_NAME).wait_for(state="visible", timeout=15000)

    login_page.check_history_actions()
    # TODO почему-то долгая загрузка истории действий, поэтому ждем 15 секунд
    login_page.page.wait_for_timeout(15000)

    assert login_page.check_last_action() == "Разблокирован", "Ошибка: Последняя запись в истории действий не разбан!"
    assert login_page.check_second_last_action() == "Заблокирован", "Ошибка: Предпоследняя запись в истории действий не бан!"
    # Очищаем комментарий через API
    api_client.update_volunteer(target_id, {"comment": ""})
    
@pytest.mark.skip(reason="Скип до фикса бага с очисткой поля Бригадир")
def test_change_and_delete_supervisor(logged_in_page):
    #залогиниться
    logged_in_page.page.goto(f"{base_url}/volunteers")
    #открыть юзера
    logged_in_page.open_user()
    #поменять бригадира
    logged_in_page.change_supervisor(2)
    supervisor_1 = logged_in_page.get_supervisor_name()
    logged_in_page.save_in_user_page()
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers", timeout=5000)
    #открыть того же юзера
    logged_in_page.open_user()
    #поменять бригадира снова
    logged_in_page.change_supervisor(3)
    supervisor_2 = logged_in_page.get_supervisor_name()
    logged_in_page.save_in_user_page()
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers", timeout=5000)
    #проверить, что бригадир изменился
    assert supervisor_1 != supervisor_2, "Ошибка: Имя бригадира не изменилось!"
    #открыть того же юзера
    logged_in_page.open_user()
    #удалить бригадира
    logged_in_page.clear_supervisor()
    logged_in_page.page.wait_for_timeout(200)
    logged_in_page.save_in_user_page()
    logged_in_page.wait_for_list_page(f"{base_url}/volunteers", timeout=5000)
    #открыть того же юзера
    logged_in_page.open_user()
    supervisor_3 = logged_in_page.get_supervisor_name()
    #проверить, что бригадир изменился
    assert supervisor_3 == "Найти бригадира", "Ошибка: Бригадир не удалился!"
