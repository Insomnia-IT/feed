import time
from selenium.webdriver.common.by import By

class registration():
    CHOOSE_LOGIN_TYPE = "label.ant-segmented-item .ant-segmented-item-label[aria-selected='false']"
    CHOOSE_QR_TYPE = "label.ant-segmented-item .ant-segmented-item-label[aria-selected='true']"
    LOGIN = "#username"
    PASSWORD = "#password"
    BUTTONREG = "//button[span[text()='Войти']]"
    CUSTOM_FIELD = "//button[span[text()='Колонки']]"
    CUSTOM_FIELD_CREATE = "//button[span[text()='Добавить колонку']]"
    CUSTOM_NAME = "input#name"
    CUSTOM_TYPE = "#type"
    SAVE_BUTTON = "//button[span[text()='Сохранить']]"



class meal_create():
    CREATE_BUTTON = ".anticon.anticon-plus-square"
    TIME_FIELD = "input#dtime"
    TIME_CHOOSE = "a.ant-picker-now-btn"
    MEAL_FIELD = "#meal_time"
    MEAL_TYPE =  ".ant-select-item-option-content:has-text('Завтрак')"
    KITCHEN_FIELD = "#kitchen"
    KITCHEN_TYPE = "div.ant-select-item-option-content:has-text('Кухня')"
    SAVE_BUTTON = "button[type='submit']"

class badge_create():
    BADGE_NAME = "#name"
    DEPARTMENT_NAME = "#direction"
    QR_NAME = "#qr"
    SUBMIT_BUTTON = "button[type='submit']"
    COUNTER = "li.ant-pagination-total-text"

class feed_history_pagination():
    NEXT_PAGE = ".anticon.anticon-right"

class group_badges():
    VOLONTEER_COUNTER = "span.ant-typography.ant-typography-secondary"
    DELETE_VOLUNTEER_BUTTON = "div:nth-child(2) > button"
    DELETE_VOLUNTEER_BUTTON_2 = "//button[span[text()='Удалить']]"
    SAVE_BUTTON = "//button[span[text()='Сохранить']]"
    ADD_VOLUNTEER = "//button[span[text()='Добавить волонтера']]"
    SEARCH_FIELD = ".ant-modal-body input[type='text']"
    CHECKBOX = "input.ant-checkbox-input"
    OK_BUTTON = "//button[span[text()='OK']]"
    EDIT_LAST_BUTTON = "button.refine-edit-button"

class custom_field():
    DELETE_ROW = "//div/div[3]/button"
    DELETE_ROW_2 = "//button[span[text()='Удалить']]"

class create_user():
    CREATE_USER_BUTTON = "//button[span[text()='Создать']]"
    SEARCH_VOLUNTEER_FIELD = "ant-input.css-sphnl3"
    USER_NAME = "#name"
    KITCHEN_NUMBER = "#kitchen"
    MEAL_TYPE = "#feed_type"
    ROLE_USER = "#main_role"
    DEPARTMENT = "#directions"
    QR_NUMBER = "#qr"
    SAVE_BUTTON = "//button[span[text()='Сохранить']]"

    ADD_VISIT_BUTTON = "//button[span[text()='Добавить заезд']]"
    VISIT_STATUS = "#arrivals_0_status"
    ZAEHAL_STATUS = "//div[contains(@class, 'ant-select-item-option-content') and text()='✅ Заехал на поле']"
    DATE_FROM = "#arrivals_0_arrival_date"
    DATE_TO = "#arrivals_0_departure_date"
    TODAY = "a.ant-picker-now-btn"

    # Бан/Разбан
    BAN_BUTTON = "//button[span[text()='Заблокировать волонтера']]"
    BAN_CONFIRM = "//button[span[text()='Заблокировать Волонтера']]"
    BAN_REASON = "#form-block_reason"

    UNBAN_BUTTON = "//button[span[text()='Разблокировать волонтера']]"
    UNBAN_CONFIRM = "//button[@type='submit'][span[text()='Разблокировать волонтера']]"


    FIND_INPUT = "input[placeholder='Поиск по волонтерам, датам, службам']"
    FIND_TESTNAME = "ant-input.css-sphnl3"

    DELETE_USER_BUTTON = "//button[span[text()='Удалить волонтера']]"
    DELETE_CONFIRM = "//button[span[text()='Да']]"
    USERS_COUNTER = 'span[data-testid="volunteer-count"]'

    INPUT_REASON = "#form-block_reason"

    # Поля для проверки прав доступа (read-only)
    KITCHEN_FIELD = "#kitchen"
    RIGHTS_FIELD = "#main_role"
    COMMENT_FIELD = "#comment"

    # История действий
    HISTORY_TAB = "//*[text()='История действий']"
    HISTORY_LOG_ITEM = "span[class*='_itemDrescrNew']"


