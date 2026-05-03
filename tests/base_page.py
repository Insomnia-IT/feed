import re
import time
import re
from datetime import datetime
from playwright.sync_api import Page

from locators import registration, meal_create, badge_create, feed_history_pagination, group_badges, custom_field, create_user

class BasePage:
    def __init__(self, page: Page, url:str):
        self.page = page
        self.url = url

    def open(self):
        self.page.goto(self.url)

    def wait_for_list_page(self, path, timeout=30000):
        self.page.wait_for_url(re.compile(rf"{re.escape(path)}(?:\?.*)?$"), timeout=timeout)


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
        # Переключаемся на таб "Логин и пароль"
        # Используем поиск по тексту, так как это наиболее надежно в данном случае
        tab = self.page.get_by_text("Логин и пароль")
        tab.first.wait_for(state="visible", timeout=7000)
        tab.first.click(force=True)
        
        # Даем время на анимацию переключения
        self.page.wait_for_timeout(1000)
        
        # Ждем, пока поле логина станет доступным для ввода
        login_input = self.page.locator(registration.LOGIN)
        login_input.wait_for(state="visible", timeout=7000)

    def first_window_qr(self):
        # Находим таб "QR-код" через локатор и кликаем принудительно
        first_button = self.page.locator(registration.CHOOSE_QR_TYPE)
        first_button.wait_for(state="visible", timeout=7000)
        first_button.click(force=True)

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
        # Всегда ждем появления поля перед вводом
        self.page.locator(registration.LOGIN).wait_for(state="visible", timeout=7000)
        login_input = self.page.locator(registration.LOGIN)
        password_input = self.page.locator(registration.PASSWORD)
        login_input.fill(login)
        password_input.fill(password)
        prod_link = self.page.locator(registration.BUTTONREG)
        prod_link.click()

    def logout(self):
        # Нажимаем кнопку выход
        logout_button = self.page.locator(registration.LOGOUT)
        logout_button.wait_for(state="visible", timeout=5000)
        logout_button.click()
        # Ждем, когда кнопка исчезнет или мы окажемся на странице логина
        self.page.wait_for_url("**/login", timeout=5000)

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
        department_option = self.page.locator(".ant-select-dropdown .ant-select-item-option").first
        department_option.wait_for(state="visible")
        department_option.click()
        role = self.page.locator("#role")
        role.click()
        role_option = self.page.locator(".ant-select-dropdown .ant-select-item-option-content").filter(
            has_text="Волонтёр"
        ).first
        role_option.wait_for(state="visible")
        role_option.click()
        qr = self.page.locator(badge_create.QR_NAME)
        qr.fill("qr" + datetime.now().strftime("%d%m%H%M%S"))
        with self.page.expect_response(
            lambda response: response.request.method == "POST"
            and "/group-badges/" in response.url
            and response.ok
        ):
            self.page.locator(badge_create.SUBMIT_BUTTON).click()

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
        first_row.wait_for(state="visible")
        return first_row.inner_text()

    def meal_table_rows(self):
        rows = self.page.locator("tbody.ant-table-tbody tr td:first-child")
        rows.first.wait_for(state="visible", timeout=30000)
        return rows.all_inner_texts()

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
        match = re.search(r"\d+", text)
        if not match:
            raise ValueError(f"Could not parse volunteer count from text: {text}")
        return int(match.group())

    def go_to_edit_badge(self):
        edit = self.page.locator(group_badges.EDIT_LAST_BUTTON).last
        edit.click()

    def open_group_badge_volunteers_tab(self):
        tab = self.page.locator(group_badges.VOLUNTEERS_TAB).first
        tab.click()

    def add_volunteer_in_group_badge(self):
        existing_volunteers = {
            name.strip()
            for name in self.page.locator("table").first.locator("tbody tr td:nth-child(1)").all_inner_texts()
            if name.strip()
        }
        add_new = self.page.locator(group_badges.ADD_VOLUNTEER)
        add_new.click()
        modal = self.page.locator(".ant-modal-content").last
        insert_name = modal.locator(group_badges.SEARCH_FIELD).first
        insert_name.click()
        insert_name.fill("Корица")
        modal_rows = modal.locator("tbody tr")
        modal_rows.first.wait_for(state="visible")
        selected_row = None
        for index in range(modal_rows.count()):
            row = modal_rows.nth(index)
            volunteer_name = row.locator("td").nth(1).inner_text().strip()
            if volunteer_name and volunteer_name not in existing_volunteers:
                selected_row = row
                break

        if selected_row is None:
            raise AssertionError("Не найден волонтёр для добавления в групповой бейдж")

        checkbox = selected_row.locator(group_badges.CHECKBOX).first
        checkbox.check(force=True)
        ok = modal.locator(group_badges.OK_BUTTON)
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
        saving.click()


    def go_to_create_user(self):
        create = self.page.locator(create_user.CREATE_USER_BUTTON)
        create.click()

    def create_user(self, user_name="Test_name", supervisor_name='None'):
        add_name = self.page.locator(create_user.USER_NAME)
        add_name.click()
        add_name.fill(user_name)
        add_supervisor = self.page.locator(create_user.SUPERVISOR)
        add_supervisor.click()
        self.page.locator(".ant-select-item-option").nth(1).click()
        self.page.wait_for_timeout(500)
        supervisor_name = add_supervisor.inner_text()
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
        return supervisor_name


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
        find.press("Enter")
        self.page.wait_for_timeout(1000)


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
        
        first_row = self.page.locator("tr.ant-table-row").first
        first_row.wait_for(state="visible")
        column = first_row.locator("td").nth(1)
        column.click()

    def edit_user(self, updated_name="_1", supervisor_name = None, original_name=None):
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
        for _ in range(3):
            add_name.click()
            add_name.clear()
            add_name.fill(updated_name)
            self.page.wait_for_timeout(500)
            # Проверяем, что React не затер наше значение оригинальным
            current_value = self.page.evaluate("() => document.querySelector('#name')?.value")
            if current_value == updated_name:
                break
        change_supervisor = self.page.locator(create_user.SUPERVISOR)
        change_supervisor.click()
        self.page.locator(".ant-select-item-option").nth(2).click()
        self.page.wait_for_timeout(300)
        supervisor_name = change_supervisor.inner_text()
        
        add_visit = self.page.locator(create_user.ADD_VISIT_BUTTON)
        add_visit.wait_for(state="visible")
        add_visit.click(force=True)
        
        # Wait for React to render the new visit form row
        self.page.wait_for_timeout(500)

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
        return supervisor_name

    def change_supervisor(self, option_index=3):
        change_supervisor = self.page.locator(create_user.SUPERVISOR)
        change_supervisor.click()
        self.page.locator(".ant-select-item-option").nth(option_index).click()
        self.page.wait_for_timeout(300)
        supervisor_name = change_supervisor.inner_text()
        return supervisor_name

    def clear_supervisor(self):
        clear_supervisor = self.page.locator(create_user.CLEAR_SUPERVISOR)
        clear_supervisor.click()
        self.page.wait_for_timeout(300)

    def get_supervisor_name(self):
        new_supervisor_name = self.page.locator(create_user.SUPERVISOR).inner_text()
        return new_supervisor_name

    def check_username_after_editing(self, expected_name="Test_name"):
        first_row = self.page.locator("tr.ant-table-row").first
        first_row.wait_for(state="visible")
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
        try:
            self.page.wait_for_function(
                '() => parseInt(document.querySelector("span[data-testid=volunteer-count]")?.innerText || "0") === 0',
                timeout=5000
            )
        except Exception:
            pass


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
        find.click()
        find.fill("")
        find.press("Enter")
        self.page.wait_for_timeout(1000)

    def ban_user(self):
        ban = self.page.locator(create_user.BAN_BUTTON)
        ban.click()
        reason = self.page.locator(create_user.BAN_REASON)
        reason.fill("Причина бана")
        confirm = self.page.locator(create_user.BAN_CONFIRM)
        confirm.click(force=True)
        self.page.wait_for_timeout(500)

    def unban_user(self):
        unban = self.page.locator(create_user.UNBAN_BUTTON)
        unban.wait_for(state="visible", timeout=15000)
        unban.click()
        reason = self.page.locator(create_user.BAN_REASON)
        reason.fill("Причина разбана")
        confirm = self.page.locator(create_user.UNBAN_CONFIRM)
        confirm.click(force=True)
        self.page.wait_for_timeout(500)

    @staticmethod
    def _block_status_from_new_value_span_text(t: str) -> str | None:
        """Только новое значение поля (как в UI), не весь innerText карточки: в diff на одной строке есть и old, и new."""
        t = t.strip()
        if t in ("Разблокирован", "Заблокирован"):
            return t
        return None

    def _block_action_from_card(self, card) -> str | None:
        """Статус блокировки из span нового значения (common-history itemDrescrNew)."""
        news = card.locator("span[class*='itemDrescrNew']")
        for i in range(news.count()):
            w = self._block_status_from_new_value_span_text(news.nth(i).inner_text())
            if w:
                return w
        return None

    def check_history_actions(self):
        # Вкладка «История изменений» / «История» (volunteer_uuid)
        self.page.locator(create_user.HISTORY_TAB).click()
        # Даем истории время прогрузиться (асинхронные логи)
        self.page.wait_for_timeout(1000)
        # Ждём карточки истории (бан/разбан может не давать span itemDrescrNew)
        self.page.locator(create_user.HISTORY_ITEM_CARD).first.wait_for(
            state="visible", timeout=15000
        )

    def _list_block_actions_from_cards(self) -> list[str]:
        """Карточки сверху вниз; по каждой — новое значение is_blocked, если оно в этом изменении."""
        items = self.page.locator(create_user.HISTORY_ITEM_CARD)
        out: list[str] = []
        for i in range(items.count()):
            w = self._block_action_from_card(items.nth(i))
            if w:
                out.append(w)
        return out

    def check_last_action(self):
        # Самое свежее событие бана/разбана среди карточек с этим полем
        actions = self._list_block_actions_from_cards()
        return actions[0] if actions else None

    def check_second_last_action(self):
        # После серии «Разблокирован» (дубликаты/старые записи) ищем предшествующий бан
        actions = self._list_block_actions_from_cards()
        if len(actions) < 2:
            return None
        i = 1
        while i < len(actions) and actions[i] == "Разблокирован":
            i += 1
        return actions[i] if i < len(actions) else None

    def get_current_volunteer_name(self):
        # Получаем имя из поля #name
        return self.page.locator(create_user.USER_NAME).input_value()

    def cleanup_volunteer_comment(self, volunteer_name):
        # Сначала выходим из текущей сессии (руководителя службы)
        self.logout()
        # ждем
        self.page.wait_for_timeout(500)
        # Переключаемся на форму логина/пароля
        self.first_window()
        # Логинимся под админом
        self.login_admin()
        self.page.wait_for_timeout(500)
        # Ищем и открываем пользователя
        find = self.page.locator(create_user.FIND_INPUT)
        find.click()
        find.fill(volunteer_name)
        self.page.wait_for_timeout(500)
        self.open_user(volunteer_name)
        # Очищаем комментарий
        self.page.wait_for_timeout(1000)
        comment = self.page.locator(create_user.COMMENT_FIELD)
        comment.press("ControlOrMeta+A")
        self.page.wait_for_timeout(1000)
        comment.press("Backspace")
        self.page.wait_for_timeout(1000)
        # Сохраняем
        self.save_in_user_page()
        # Ждем возврата в список волонтеров
        self.page.wait_for_timeout(5000)
