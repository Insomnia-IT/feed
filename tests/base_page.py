import time
from datetime import datetime
from playwright.sync_api import Page

from locators import *
# registration meal_create badge_create feed_history_pagination group_badges custom_field create_user

class BasePage:
    def __init__(self, page: Page, url:str):
        self.page = page
        self.url = url

    def open(self):
        self.page.goto(self.url)

    def wait_for_path(self, path, timeout=30000):
        self.page.wait_for_function(
            "(expectedPath) => window.location.pathname === expectedPath",
            arg=path,
            timeout=timeout,
        )

    def wait_for_settled_page(self, timeout=10000):
        try:
            self.page.wait_for_load_state("networkidle", timeout=timeout)
        except Exception:
            # Some SPA updates keep background requests open; allow the caller to continue.
            pass


    def is_element_present(self, how, what):
        return self.page.locator(what).is_visible()

    def is_not_element_present(self, how, what, timeout=4000):
        # Playwright's wait_for takes timeout in milliseconds.
        try:
            self.page.locator(what).wait_for(state="visible", timeout=timeout)
            return False
        except Exception:
            return True

    def is_element_disabled(self, what):
        # Проверяем наличие атрибута 'disabled' у элемента
        return self.page.locator(what).is_disabled()


    def first_window(self):
        login_input = self.page.locator(registration.LOGIN)
        if login_input.is_visible():
            return

        segmented_items = self.page.locator(registration.SEGMENTED_ITEMS)
        segmented_items.first.wait_for(state="visible")
        segmented_items.nth(1).click()
        login_input.wait_for(state="visible")

    def first_window_qr(self):
        login_input = self.page.locator(registration.LOGIN)
        if not login_input.is_visible():
            return

        segmented_items = self.page.locator(registration.SEGMENTED_ITEMS)
        segmented_items.first.wait_for(state="visible")
        segmented_items.first.click()
        login_input.wait_for(state="hidden")

    def scan_user(self, qr_code="20635ffe1ad2496f8cfc5668d7e8b34d"):
        # login.tsx вешает слушатель 'scan' на document внутри useEffect.
        # Даем React время зарегистрировать его после рендера страницы.
        self.page.wait_for_timeout(500)
        # Диспатчим в точности так же как onscan.js: с bubbles:true
        self.page.evaluate(f"""
            document.dispatchEvent(new CustomEvent("scan", {{
                bubbles: true,
                detail: {{ scanCode: "{qr_code}" }}
            }}));
        """)

    def login_admin(self):
        login = "admin"
        password = "Kolombina25"
        login_input = self.page.locator(registration.LOGIN)
        password_input = self.page.locator(registration.PASSWORD)
        login_input.fill(login)
        password_input.fill(password)
        prod_link = self.page.locator(registration.BUTTONREG)
        prod_link.click()

    def pagination(self):
        page_link = self.page.locator(".ant-pagination-item-2")
        page_link.click()

    def go_to_create_new_meal(self):
        go_to_create = self.page.locator("//button[span[text()='Создать']]")
        go_to_create.click()

    def create_new_meal(self):
        time_field = self.page.locator(meal_create.TIME_FIELD)
        time_field.click()
        choose_time = self.page.locator(meal_create.TIME_CHOOSE)
        choose_time.click()
        choose_meal = self.page.locator(meal_create.MEAL_FIELD)
        choose_meal.click()
        choose_meal_type = self.page.locator(meal_create.MEAL_TYPE)
        choose_meal_type.click()
        kitchen = self.page.locator(meal_create.KITCHEN_FIELD)
        kitchen.fill("Кухня №2")
        kitchen.press("Tab")
        self.page.locator(meal_create.SAVE_BUTTON).click()


    def go_to_create_badge(self):
        go_to_create = self.page.locator(".refine-create-button")
        go_to_create.click()


    def create_badge(self):
        badge_name =self.page.locator(badge_create.BADGE_NAME)
        badge_name.fill("autotest" + datetime.now().strftime("%d%m%H%M%S"))
        department = self.page.locator(badge_create.DEPARTMENT_NAME)
        department.click()
        # Ждем пока выпадашка раскроется и в ней появятся элементы
        department_dropdown = self.page.locator(".ant-select-dropdown:visible").last
        department_option = department_dropdown.locator(".ant-select-item-option").first
        department_option.wait_for(state="visible")
        department_option.click()
        self.page.wait_for_function(
            "() => !!document.querySelector('#direction')?.closest('.ant-select')?.querySelector('.ant-select-selection-item')?.textContent?.trim()",
            timeout=5000,
        )
        role = self.page.locator(badge_create.ROLE_NAME)
        role.click()
        role_dropdown = self.page.locator(".ant-select-dropdown:visible").last
        role_option = role_dropdown.locator(".ant-select-item-option").first
        role_option.wait_for(state="visible")
        role_option.click(force=True)
        self.page.wait_for_function(
            "() => !!document.querySelector('#role')?.closest('.ant-select')?.querySelector('.ant-select-selection-item')?.textContent?.trim()",
            timeout=5000,
        )
        qr = self.page.locator(badge_create.QR_NAME)
        qr.fill("qr" + datetime.now().strftime("%d%m%H%M%S"))
        self.page.wait_for_function(
            "() => document.querySelector('#name')?.value && document.querySelector('#qr')?.value && !document.querySelector('button.refine-save-button')?.disabled",
            timeout=5000,
        )
        with self.page.expect_response(
            lambda response: response.request.method == "POST" and "/group-badges" in response.url,
            timeout=10000,
        ) as create_response:
            self.page.locator("button.refine-save-button").first.click()
        response = create_response.value
        if response.status >= 400:
            raise AssertionError(f"Group badge creation failed with status {response.status}: {response.url}")

    def badges_counter(self):
        # Ждем пока счетчик стабилизируется (не меняется 2 итерации подряд)
        import time
        prev = None
        for _ in range(10):
            try:
                counter = self.page.locator(badge_create.COUNTER).inner_text()
                current = int(counter.split(": ")[1].split(" ")[0])
                print(f"[DEBUG] badges_counter raw: '{counter}'")
                if current == prev and current > 0:
                    return current
                prev = current
            except Exception:
                pass
            time.sleep(0.5)
        # последнее значение
        return prev or 0


    def meal_table(self):
        first_row = self.page.locator("tbody.ant-table-tbody tr:first-child td:first-child")
        return first_row.inner_text()

    def open_meal(self):
        first_row = self.page.locator("tr.ant-table-row").first
        column = first_row.locator("td").nth(1)
        column.click()

    def meal_deleting(self):
        delete_buttons = self.page.locator("button.refine-delete-button")
        if delete_buttons.count() > 0:
            delete_button = delete_buttons.first
            delete_button.click()
        confirm_button = self.page.locator("//button[span[text()='Удалить']]")
        confirm_button.click()

    def meal_history_pagination(self):
        next_page = self.page.locator(feed_history_pagination.NEXT_PAGE)
        next_page.click()

    def go_to_custom_field_creating(self):
        custom_field = self.page.locator(registration.CUSTOM_FIELD)
        custom_field.click()

    def go_to_custom_field_creating_2(self):
        create_column = self.page.locator(registration.CUSTOM_FIELD_CREATE)
        create_column.click()


    def create_custom_field(self):
        name = self.page.locator(registration.CUSTOM_NAME)
        name.click()
        name.fill("user" + datetime.now().strftime("H%M%S"))
        type = self.page.locator(registration.CUSTOM_TYPE)
        type.click()
        type.press("Enter")
        type.press("Enter")
        save_button = self.page.locator(registration.SAVE_BUTTON)
        save_button.click()

    def delete_row(self):
        delete_row = self.page.locator(custom_field.DELETE_ROW).last
        delete_row.click()
        delete_row_2 = self.page.locator(custom_field.DELETE_ROW_2)
        delete_row_2.click()

    def receive_count_of_volunteers_in_group_badge(self):
        element_raw = self.page.locator(group_badges.VOLONTEER_COUNTER).first
        text = element_raw.inner_text()
        element = int(text.strip("()"))
        return element

    def go_to_edit_badge(self):
        edit = self.page.locator(group_badges.EDIT_LAST_BUTTON).last
        edit.click()

    def add_volunteer_in_group_badge(self):
        add_new = self.page.locator(group_badges.ADD_VOLUNTEER)
        add_new.click()
        insert_name = self.page.locator(group_badges.SEARCH_FIELD).last
        insert_name.click()
        insert_name.fill("Корица")
        checkbox = self.page.locator(group_badges.CHECKBOX).last
        checkbox.click()
        ok = self.page.locator(group_badges.OK_BUTTON)
        ok.click()


    def delete_volunteer_from_group_badge(self):
        delete_him = self.page.locator(group_badges.DELETE_VOLUNTEER_BUTTON).last
        delete_him.click()
        delete_him_2 = self.page.locator(group_badges.DELETE_VOLUNTEER_BUTTON_2)
        delete_him_2.click()

    def delete_group_badge(self):
        delete = self.page.locator("button.refine-delete-button").last
        delete.click()
        confirm = self.page.locator("//button[span[text()='Удалить']]")
        confirm.click()

    def receive_badges_count(self):
        amount = self.page.locator("li.ant-pagination-total-text")
        amount_number = amount.inner_text()
        return amount_number


    def save_in_group_badge(self):
        saving = self.page.locator(group_badges.SAVE_BUTTON)
        self.page.wait_for_function(
            "() => !Array.from(document.querySelectorAll('button')).filter((button) => button.textContent?.includes('Сохранить')).at(-1)?.disabled",
            timeout=5000,
        )
        saving.first.click()
        try:
            confirm = self.page.locator(group_badges.SAVE_BUTTON).nth(1)
            confirm.wait_for(state="visible", timeout=3000)
            self.page.wait_for_function(
                "() => !Array.from(document.querySelectorAll('button')).filter((button) => button.textContent?.includes('Сохранить')).at(-1)?.disabled",
                timeout=5000,
            )
            confirm.click(force=True)
        except Exception:
            pass


    def go_to_create_user(self):
        create = self.page.locator(create_user.CREATE_USER_BUTTON)
        create.click()

    def create_user(self, user_name="Test_name"):
        add_name = self.page.locator(create_user.USER_NAME)
        add_name.click()
        add_name.fill(user_name)
        add_kitchen = self.page.locator(create_user.KITCHEN_NUMBER)
        add_kitchen.click()
        add_kitchen.press("Tab")
        add_meal = self.page.locator(create_user.MEAL_TYPE)
        add_meal.click()
        add_meal.press("Tab")
        add_role = self.page.locator(create_user.ROLE_USER)
        add_role.click()
        add_role.press("Tab")
        add_department = self.page.locator(create_user.DEPARTMENT)
        add_department.click()
        add_department.press("Tab")
        add_qr = self.page.locator(create_user.QR_NUMBER)
        add_qr.click()
        add_qr.fill("qr" + datetime.now().strftime("%d%m%H%M%S"))


    def save_in_user_page(self):
        # Кликаем первую кнопку "Сохранить"
        save = self.page.locator(create_user.SAVE_BUTTON).first
        save.click()
        # Проверяем, появилась ли вторая кнопка "Сохранить" (модалка подтверждения)
        # Ждем максимум 3 секунды — если не появилась, значит её нет
        try:
            confirm = self.page.locator(create_user.SAVE_BUTTON).nth(1)
            confirm.wait_for(state="visible", timeout=3000)
            # Ждем пока кнопка станет активной (может стартовать disabled)
            self.page.wait_for_function(
                "() => !Array.from(document.querySelectorAll('button.refine-save-button')).at(-1)?.disabled",
                timeout=5000
            )
            confirm.click(force=True)
        except Exception:
            # если нет модалки, иди дальше
            pass

    def find_user(self, user_name="Test_name"):
        find = self.page.locator(create_user.FIND_INPUT)
        find.fill(user_name)


    def open_user(self, expected_name=None):
        if expected_name:
            # Даем таблице время отфильтроваться после ввода в поиск
            try:
                self.page.wait_for_function(
                    f"() => document.querySelector('tr.ant-table-row:first-child td:nth-child(2)')?.innerText === '{expected_name}'",
                    timeout=5000
                )
            except Exception:
                pass
        
        self.page.wait_for_timeout(500)
        first_row = self.page.locator("tr.ant-table-row").first
        first_row.wait_for(state="attached")
        column = first_row.locator("td").nth(1)
        column.click()

    def edit_user(self, updated_name="_1", original_name=None):
        add_name = self.page.locator(create_user.USER_NAME)
        
        if original_name:
            # Ждем пока форма прогрузит данные с бекенда (в инпуте появится оригинальное имя)
            try:
                self.page.wait_for_function(
                    f"() => document.querySelector('#name')?.value === '{original_name}'",
                    timeout=5000
                )
            except Exception:
                pass
        else:
            # Fallback для старых тестов: просто ждем пару секунд
            self.page.wait_for_timeout(2000)
            
        # Надежно устанавливаем имя, борясь с React, который может его затереть
        for _ in range(5):
            add_name.click()
            add_name.clear()
            add_name.fill(updated_name)
            self.page.wait_for_timeout(500)
            # Проверяем, что React не затер наше значение оригинальным
            current_value = self.page.evaluate("() => document.querySelector('#name')?.value")
            if current_value == updated_name:
                break
        add_visit = self.page.locator(create_user.ADD_VISIT_BUTTON)
        add_visit.wait_for(state="visible")
        add_visit.click()
        
        # Wait for React to render the new visit form row
        self.page.wait_for_timeout(500)
        
        # Wait for the status dropdown to appear in the DOM
        status = self.page.locator(create_user.VISIT_STATUS)
        status.wait_for(state="attached")
        status.click()
        zaehal = self.page.locator(create_user.ZAEHAL_STATUS)
        zaehal.click()
        date_from = self.page.locator(create_user.DATE_FROM)
        date_from.click()
        today = self.page.locator(create_user.TODAY)
        today.click()
        date_to = self.page.locator(create_user.DATE_TO)
        date_to.click()
        today_last = self.page.locator(create_user.TODAY).last
        today_last.click()
        self.save_in_user_page()

    def check_username_after_editing(self, expected_name="Test_name"):
        first_row = self.page.locator("tr.ant-table-row").first
        column = first_row.locator("td").nth(1)
        try:
            # Даем таблице время отфильтроваться после ввода в поиск
            self.page.wait_for_function(
                f"() => document.querySelector('tr.ant-table-row:first-child td:nth-child(2)')?.innerText === '{expected_name}'",
                timeout=5000
            )
        except Exception:
            pass
        column_text = column.inner_text()
        return column_text

    def check_username_after_deleting(self, expected_name="Test_updated_name"):
        find = self.page.locator(create_user.FIND_INPUT)
        find.fill(expected_name)


    def delete_user(self):
        delete1 = self.page.locator(create_user.DELETE_USER_BUTTON)
        delete1.click()
        delete2 = self.page.locator(create_user.DELETE_CONFIRM)
        delete2.click()

    def receive_volunteers_count(self):
        amount = self.page.locator(create_user.USERS_COUNTER)
        # Ждём, пока в счётчике появится текст
        import time
        for _ in range(10):
            text = amount.inner_text().strip()
            if text and text.isdigit():
                return int(text)
            time.sleep(0.5)
        # Fallback if it still fails
        return int(amount.inner_text().strip())

    def clear_input_field(self):
        find = self.page.locator(create_user.FIND_INPUT)
        find.press("End")  # Перемещаем курсор в конец строки
        val = find.input_value()
        for _ in range(len(val)):
            find.press("Backspace")  # Удаляем символы один за другим

    def ban_user(self):
        ban = self.page.locator(create_user.BAN_BUTTON)
        ban.click()
        reason = self.page.locator(create_user.BAN_REASON)
        reason.fill("Причина бана")
        confirm = self.page.locator(create_user.BAN_CONFIRM)
        confirm.click()

    def unban_user(self):
        unban = self.page.locator(create_user.UNBAN_BUTTON)
        unban.wait_for(state="visible", timeout=5000)
        unban.click()
        reason = self.page.locator(create_user.BAN_REASON)
        reason.fill("Причина разбана")
        confirm = self.page.locator(create_user.UNBAN_CONFIRM)
        confirm.click()

    def check_history_actions(self):
        # Кликаем по вкладке "История действий"
        self.page.locator(create_user.HISTORY_TAB).click()
        # Даем истории время прогрузиться (асинхронные логи)
        self.page.wait_for_timeout(1000)
        # Ждем появления элементов в списке истории
        self.page.locator(create_user.HISTORY_LOG_ITEM).first.wait_for(state="visible", timeout=5000)



    def check_last_action(self):
        # Возвращаем текст последнего действия
        return self.page.locator(create_user.HISTORY_LOG_ITEM).nth(1).inner_text().strip()

    def check_second_last_action(self):
        # Возвращаем текст предпоследнего действия
        return self.page.locator(create_user.HISTORY_LOG_ITEM).nth(3).inner_text().strip()
