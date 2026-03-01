from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from datetime import datetime
import time

from locators import *
# registration meal_create badge_create feed_history_pagination group_badges custom_field create_user

class BasePage:
    def __init__(self, browser, url, timeout=10):
        self.browser = browser
        self.url = url
        self.browser.implicitly_wait(timeout)
        self.driver = browser


    def open(self):
        self.browser.get(self.url)


    def is_element_present(self, how, what):
        try:
            self.browser.find_element(how, what)
        except NoSuchElementException:
            return False
        return True

    def is_not_element_present(self, how, what, timeout=4):
        try:
            WebDriverWait(self.browser, timeout).until(EC.presence_of_element_located((how, what)))
        except TimeoutException:
            return True
        return False

    def first_window(self):
        first_button = self.browser.find_element(*registration.CHOOSE_LOGIN_TYPE)
        first_button.click()

    def first_window_qr(self):
        first_button = self.browser.find_element(*registration.CHOOSE_QR_TYPE)
        first_button.click()

    def scan_user(self):
        self.driver.execute_script("""
            document.body.dispatchEvent(new CustomEvent("scan", { 
                detail: { scanCode: "e93e5fae99bd43b4b77d5c0235b14da9" } 
            }));
        """)
        time.sleep(2)


    def login_admin(self):
        login = "admin"
        password = "Kolombina25"
        login_input = self.browser.find_element(*registration.LOGIN)
        password_input = self.browser.find_element(*registration.PASSWORD)
        login_input.send_keys(login)
        password_input.send_keys(password)
        prod_link = self.browser.find_element(*registration.BUTTONREG)
        prod_link.click()

    def pagination(self):
        page_link = self.browser.find_element(By.CLASS_NAME, "ant-pagination-item-2")
        page_link.click()

    def go_to_create_new_meal(self):
        go_to_create = self.browser.find_element(By.XPATH, "//button[span[text()='Создать']]")
        go_to_create.click()

    def create_new_meal(self):
        time.sleep(1)
        time_field = self.browser.find_element(*meal_create.TIME_FIELD)
        time_field.click()
        time.sleep(1)
        choose_time = self.browser.find_element(*meal_create.TIME_CHOOSE)
        choose_time.click()
        choose_meal = self.browser.find_element(*meal_create.MEAL_FIELD)
        choose_meal.click()
        time.sleep(1)
        choose_meal_type = self.browser.find_element(*meal_create.MEAL_TYPE)
        choose_meal_type.click()
        time.sleep(1)
        kitchen = self.browser.find_element(*meal_create.KITCHEN_FIELD)
        kitchen.send_keys("Кухня №2")
        kitchen.send_keys(Keys.TAB)
        time.sleep(3)
        self.browser.find_element(*meal_create.SAVE_BUTTON).click()


    def go_to_create_badge(self):
        go_to_create = self.browser.find_element(By.CSS_SELECTOR, ".refine-create-button")
        go_to_create.click()


    def create_badge(self):
        badge_name =self.browser.find_element(*badge_create.BADGE_NAME)
        badge_name.send_keys("autotest" + datetime.now().strftime("%d%m%H%M%S"))
        department = self.browser.find_element(*badge_create.DEPARTMENT_NAME)
        department.click()
        department.send_keys(Keys.ENTER)
        department.send_keys(Keys.ENTER)
        qr = self.browser.find_element(*badge_create.QR_NAME)
        qr.send_keys("qr" + datetime.now().strftime("%d%m%H%M%S"))
        self.browser.find_element(*badge_create.SUBMIT_BUTTON).click()

    def badges_counter(self):
        counter = self.browser.find_element(*badge_create.COUNTER).text
        initial_count = int(counter.split(": ")[1])
        return initial_count


    def meal_table(self):
        first_row = self.browser.find_element(By.CSS_SELECTOR, "tbody.ant-table-tbody tr:first-child td:first-child")
        return first_row.text

    def meal_deleting(self):
        delete_buttons = self.browser.find_elements(By.CSS_SELECTOR,"button.refine-delete-button")
        if delete_buttons:
            delete_button = delete_buttons[0]
            delete_button.click()
        time.sleep(1)
        confirm_button = self.browser.find_element(By.XPATH, "//button[span[text()='Удалить']]")
        confirm_button.click()

    def meal_history_pagination(self):
        next_page = self.browser.find_element(*feed_history_pagination.NEXT_PAGE)
        next_page.click()

    def go_to_custom_field_creating(self):
        time.sleep(3)
        custom_field = self.browser.find_element(*registration.CUSTOM_FIELD)
        custom_field.click()
        time.sleep(3)

    def go_to_custom_field_creating_2(self):
        create_column = self.browser.find_element(*registration.CUSTOM_FIELD_CREATE)
        create_column.click()


    def create_custom_field(self):
        name = self.browser.find_element(*registration.CUSTOM_NAME)
        name.click()
        name.send_keys("user" + datetime.now().strftime("H%M%S"))
        type = self.browser.find_element(*registration.CUSTOM_TYPE)
        type.click()
        type.send_keys(Keys.ENTER)
        type.send_keys(Keys.ENTER)
        save_button = self.browser.find_element(*registration.SAVE_BUTTON)
        save_button.click()

    def delete_row(self):
        delete_row_1 = self.browser.find_elements(*custom_field.DELETE_ROW)
        if delete_row_1:
            delete_row = delete_row_1[-1]  # Берем последний
            delete_row.click()
        time.sleep(1)
        delete_row_2 = self.browser.find_element(*custom_field.DELETE_ROW_2)
        delete_row_2.click()

    def receive_count_of_volunteers_in_group_badge(self):
        element_raw = self.browser.find_element(*group_badges.VOLONTEER_COUNTER)
        element = int(element_raw.text)
        return element

    def go_to_edit_badge(self):
        edit_0 = self.browser.find_elements(*group_badges.EDIT_LAST_BUTTON)
        if edit_0:
            edit = edit_0[-1]  # Берем последний
            edit.click()

    def add_volunteer_in_group_badge(self):
        add_new = self.browser.find_element(*group_badges.ADD_VOLUNTEER)
        add_new.click()
        time.sleep(6)
        insert_name_raw = self.browser.find_elements(*group_badges.SEARCH_FIELD)
        if insert_name_raw:
            insert_name=insert_name_raw[-1]
            insert_name.click()
        insert_name.send_keys("Корица")
        time.sleep(10)
        checkbox = self.browser.find_elements(*group_badges.CHECKBOX)
        if checkbox:
            last_checkbox = checkbox[-1]  # Берем последний чекбокс
            last_checkbox.click()
        ok = self.browser.find_element(*group_badges.OK_BUTTON)
        ok.click()


    def delete_volunteer_from_group_badge(self):
        delete_him_1 = self.browser.find_elements(*group_badges.DELETE_VOLUNTEER_BUTTON)
        if delete_him_1:
            delete_him = delete_him_1[-1]  # Берем последний чекбокс
            delete_him.click()
            time.sleep(1)
        delete_him_2 = self.browser.find_element(*group_badges.DELETE_VOLUNTEER_BUTTON_2)
        delete_him_2.click()
        time.sleep(1)

    def delete_group_badge(self):
        delete1 = self.browser.find_elements(By.CSS_SELECTOR, "button.refine-delete-button")
        if delete1:
            delete = delete1[-1]  # Берем последний чекбокс
            delete.click()
        time.sleep(2)
        confirm = self.browser.find_element(By.XPATH, "//button[span[text()='Удалить']]")
        confirm.click()
        time.sleep(2)

    def receive_badges_count(self):
        amount = self.browser.find_element(By.CSS_SELECTOR, "li.ant-pagination-total-text")
        amount_number = amount.text
        return amount_number


    def save_in_group_badge(self):
        saving = self.browser.find_element(*group_badges.SAVE_BUTTON)
        saving.click()


    def go_to_create_user(self):
        create = self.browser.find_element(*create_user.CREATE_USER_BUTTON)
        create.click()

    def create_user(self):
        add_name = self.browser.find_element(*create_user.USER_NAME)
        add_name.click()
        add_name.send_keys("Test_name")
        add_kitchen = self.browser.find_element(*create_user.KITCHEN_NUMBER)
        add_kitchen.click()
        add_kitchen.send_keys(Keys.TAB)
        add_meal = self.browser.find_element(*create_user.MEAL_TYPE)
        add_meal.click()
        add_meal.send_keys(Keys.TAB)
        add_role = self.browser.find_element(*create_user.ROLE_USER)
        add_role.click()
        add_role.send_keys(Keys.TAB)
        add_department = self.browser.find_element(*create_user.DEPARTMENT)
        add_department.click()
        add_department.send_keys(Keys.TAB)
        add_qr = self.browser.find_element(*create_user.QR_NUMBER)
        add_qr.click()
        add_qr.send_keys("qr" + datetime.now().strftime("%d%m%H%M%S"))


    def save_in_user_page(self):
        save = self.browser.find_element(*create_user.SAVE_BUTTON)
        save.click()
        confirm = self.browser.find_elements(*create_user.SAVE_BUTTON)
        if confirm:
            confirm1 = confirm[-1]  # Берем последний чекбокс
            confirm1.click()

    def find_user(self):
        find = self.browser.find_element(*create_user.FIND_INPUT)
        find.send_keys("Test_name")
        time.sleep(3)


    def open_user(self):
        first_row = self.browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row")[0]
        column = first_row.find_elements(By.CSS_SELECTOR, "td")[1]
        column.click()
        time.sleep(2)

    def edit_user(self):
        add_name = self.browser.find_element(*create_user.USER_NAME)
        add_name.clear()
        time.sleep(1)
        add_name.send_keys("_1")
        add_visit = self.browser.find_element(*create_user.ADD_VISIT_BUTTON)
        add_visit.click()
        time.sleep(1)
        status = self.browser.find_element(*create_user.VISIT_STATUS)
        status.click()
        zaehal = self.browser.find_element(*create_user.ZAEHAL_STATUS)
        zaehal.click()
        date_from = self.browser.find_element(*create_user.DATE_FROM)
        date_from.click()
        time.sleep(1)
        today = self.browser.find_element(*create_user.TODAY)
        today.click()
        time.sleep(1)
        date_to = self.browser.find_element(*create_user.DATE_TO)
        date_to.click()
        time.sleep(2)
        today1 = self.browser.find_elements(*create_user.TODAY)
        if today1:
            today2 = today1[-1]  # Берем последний чекбокс
            today2.click()
        time.sleep(1)
        save = self.browser.find_element(*create_user.SAVE_BUTTON)
        save.click()

    def check_username_after_editing(self):
        first_row = self.browser.find_elements(By.CSS_SELECTOR, "tr.ant-table-row")[0]
        column = first_row.find_elements(By.CSS_SELECTOR, "td")[1]
        column_text = column.text
        time.sleep(2)
        return column_text

    def check_username_after_deleting(self):
        find = self.browser.find_element(*create_user.FIND_INPUT)
        find.send_keys("Test_updated_name")
        time.sleep(1)


    def delete_user(self):
        delete1 = self.browser.find_element(*create_user.DELETE_USER_BUTTON)
        delete1.click()
        time.sleep(1)
        delete2 = self.browser.find_element(*create_user.DELETE_CONFIRM)
        delete2.click()

    def receive_volunteers_count(self):
        amount = self.browser.find_element(*create_user.USERS_COUNTER)
        amount_number = int(amount.text)
        return amount_number

    def clear_input_field(self):
        find = self.browser.find_element(*create_user.FIND_INPUT)
        find.send_keys(Keys.END)  # Перемещаем курсор в конец строки
        for _ in range(len(find.get_attribute("value"))):
            find.send_keys(Keys.BACKSPACE)  # Удаляем символы один за другим




































