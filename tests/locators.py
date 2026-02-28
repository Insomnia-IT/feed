import time
from selenium.webdriver.common.by import By

class registration():
    CHOOSE_LOGIN_TYPE = (By.CSS_SELECTOR, "label.ant-segmented-item .ant-segmented-item-label[aria-selected='false']")
    CHOOSE_QR_TYPE = (By.CSS_SELECTOR, "label.ant-segmented-item .ant-segmented-item-label[aria-selected='true']")
    LOGIN = (By.ID, "username")
    PASSWORD = (By.ID, "password")
    BUTTONREG = (By.XPATH, "//button[span[text()='Войти']]")
    CUSTOM_FIELD = (By.XPATH, "//button[span[text()='Колонки']]")
    CUSTOM_FIELD_CREATE = (By.XPATH, "//button[span[text()='Добавить колонку']]")
    CUSTOM_NAME = (By.CSS_SELECTOR, "input#name")
    CUSTOM_TYPE = (By.ID, "type")
    SAVE_BUTTON = (By.CLASS_NAME, "ant-btn.css-sphnl3.ant-btn-primary.ant-btn-color-primary.ant-btn-variant-solid")



class meal_create():
    CREATE_BUTTON = (By.CLASS_NAME, "anticon anticon-plus-square")
    TIME_FIELD = (By.CSS_SELECTOR, 'input#dtime')
    TIME_CHOOSE = (By.CSS_SELECTOR, 'a.ant-picker-now-btn')
    MEAL_FIELD = (By.ID, "meal_time")
    MEAL_TYPE =  (By.CLASS_NAME, "ant-select-item-option-content")
    KITCHEN_FIELD = (By.ID, "kitchen")
    KITCHEN_TYPE = (By.CSS_SELECTOR, "div.ant-select-item-option-content:contains('Кухня')")
    SAVE_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")

class badge_create():
    BADGE_NAME = (By.ID, "name")
    DEPARTMENT_NAME = (By.ID, "direction")
    QR_NAME = (By.ID, "qr")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    COUNTER = (By.CSS_SELECTOR, "li.ant-pagination-total-text")

class feed_history_pagination():
    NEXT_PAGE = (By.CLASS_NAME, "anticon.anticon-right")

class group_badges():
    VOLONTEER_COUNTER = (By.CSS_SELECTOR, 'span[data-testid="volunteer-count-value"]')
    DELETE_VOLUNTEER_BUTTON = (By.CSS_SELECTOR, "div:nth-child(2) > button")
    DELETE_VOLUNTEER_BUTTON_2 = (By.XPATH, "//button[span[text()='Удалить']]")
    SAVE_BUTTON = (By.XPATH, "//button[span[text()='Сохранить']]")
    ADD_VOLUNTEER = (By.XPATH, "//button[span[text()='Добавить волонтера']]")
    SEARCH_FIELD = (By.CSS_SELECTOR, "body > div:nth-child(2) > div > div.ant-modal-wrap > div > div:nth-child(1) > div div.ant-modal-body > input")
    CHECKBOX = (By.CSS_SELECTOR,"input.ant-checkbox-input")
    OK_BUTTON = (By.XPATH, "//button[span[text()='OK']]")
    EDIT_LAST_BUTTON = (By.CSS_SELECTOR, "button.refine-edit-button")

class custom_field():
    DELETE_ROW = (By.XPATH, "//div/div[3]/button")
    DELETE_ROW_2 = (By.XPATH, "//button[span[text()='Удалить']]")

class create_user():
    CREATE_USER_BUTTON = (By.XPATH, "//button[span[text()='Создать']]")
    SEARCH_VOLUNTEER_FIELD = (By.CSS_SELECTOR, "ant-input css-sphnl3")
    USER_NAME = (By.CSS_SELECTOR, "#name")
    KITCHEN_NUMBER = (By.CSS_SELECTOR, "#kitchen")
    MEAL_TYPE = (By.CSS_SELECTOR, "#feed_type")
    ROLE_USER = (By.CSS_SELECTOR, "#main_role")
    DEPARTMENT = (By.CSS_SELECTOR, "#directions")
    QR_NUMBER = (By.CSS_SELECTOR, "#qr")
    SAVE_BUTTON = (By.XPATH, "//button[span[text()='Сохранить']]")

    ADD_VISIT_BUTTON = (By.XPATH, "//button[span[text()='Добавить заезд']]")
    VISIT_STATUS = (By.CSS_SELECTOR, "#arrivals_0_status")
    ZAEHAL_STATUS = (By.XPATH, "//div[contains(@class, 'ant-select-item-option-content') and text()='✅ Заехал на поле']")
    DATE_FROM = (By.CSS_SELECTOR, "#arrivals_0_arrival_date")
    DATE_TO = (By.CSS_SELECTOR, "#arrivals_0_departure_date")
    TODAY = (By.CSS_SELECTOR, "a.ant-picker-now-btn")
    BAN_BUTTON = (By.XPATH, "//button[span[text()='Заблокировать Волонтера']]")
    BAN_REASON = (By.CSS_SELECTOR, "#form-block_reason")

    FIND_INPUT = (By.CSS_SELECTOR, "input[placeholder='Поиск по волонтерам, датам, службам']")
    FIND_TESTNAME = (By.CSS_SELECTOR, "ant-input.css-sphnl3")

    DELETE_USER_BUTTON = (By.XPATH, "//button[span[text()='Удалить волонтера']]")
    DELETE_CONFIRM = (By.XPATH, "//button[span[text()='Да']]")
    USERS_COUNTER = (By.CSS_SELECTOR, 'span[data-testid="volunteer-count"]')
