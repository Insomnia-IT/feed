# API-клиент для автотестов

Файл: `tests/api_client.py`

## Что это

`ApiClient` — это единый класс для работы с API бэкенда. Он прячет технические детали (URL, заголовки, токены) и предоставляет простые методы для создания/чтения/изменения/удаления данных.

## Как получить клиент

В тестах используй фикстуру `api_client` из `conftest.py`:

```python
def test_example(api_client):
    # api_client уже авторизован под админом
    volunteers = api_client.get_volunteers_list()
```

Фикстура `api_client` создаётся **один раз на всю тестовую сессию** и сразу логинится под админом.

## Базовые методы

### Методы с автоматической проверкой ошибок

Эти методы проверяют HTTP-статус и выбрасывают исключение при ошибке (4xx, 5xx). Возвращают JSON (словарь Python).

| Метод               | Описание      |
| ------------------- | ------------- |
| `get(path, params)` | GET-запрос    |
| `post(path, json)`  | POST-запрос   |
| `patch(path, json)` | PATCH-запрос  |
| `delete(path)`      | DELETE-запрос |

Пример:

```python
# Получить список направлений
directions = api_client.get("/directions/")

# Создать волонтера
volunteer = api_client.post("/volunteers/", json={"name": "Иван"})

# Обновить волонтера
api_client.patch("/volunteers/123/", json={"is_blocked": True})

# Удалить волонтера
api_client.delete("/volunteers/123/")
```

### Raw-методы (без проверки ошибок)

Иногда нужно проверить, что API возвращает **конкретный статус ошибки** (например, 401 Unauthorized). Обычные методы выбросили бы исключение и не дали бы проверить статус.

Для этого используй **raw-методы** — они возвращают объект `Response` из библиотеки `requests` без проверки статуса.

| Метод                            | Описание                   |
| -------------------------------- | -------------------------- |
| `get_raw(path, params, headers)` | GET без проверки ошибок    |
| `post_raw(path, json, headers)`  | POST без проверки ошибок   |
| `patch_raw(path, json, headers)` | PATCH без проверки ошибок  |
| `delete_raw(path, headers)`      | DELETE без проверки ошибок |

Пример — проверка что QR без прав доступа возвращает 401:

```python
def test_scan_qr_without_access_rights(api_client, qr_login_volunteer):
    qr = qr_login_volunteer["qr"]
    response = api_client.get_raw(
        "/volunteers/",
        params={"limit": 1, "qr": qr},
        headers={"Authorization": f"V-TOKEN {qr}"}
    )
    assert response.status_code == 401
```

## Методы для сущностей

Помимо базовых `get/post/patch/delete`, клиент имеет готовые методы для работы с основными сущностями системы.

### Волонтёры

| Метод                                       | Пример                                                  |
| ------------------------------------------- | ------------------------------------------------------- |
| `create_volunteer(data)`                    | `api_client.create_volunteer({"name": "Иван", ...})`    |
| `update_volunteer(id, data)`                | `api_client.update_volunteer(123, {"name": "Пётр"})`    |
| `delete_volunteer(id)`                      | `api_client.delete_volunteer(123)`                      |
| `get_volunteer(id)`                         | `api_client.get_volunteer(123)`                         |
| `get_volunteers_list(params)`               | `api_client.get_volunteers_list({"limit": 10})`         |
| `set_block_state(id, is_blocked, qr_token)` | `api_client.set_block_state(123, True, qr_token="abc")` |
| `set_supervisor(id, supervisor_id)`         | `api_client.set_supervisor(123, 456)`                   |
| `get_volunteer_by_qr(qr_token)`             | `api_client.get_volunteer_by_qr("abc123")`              |

### Групповые бейджи

| Метод                      | Пример                                                   |
| -------------------------- | -------------------------------------------------------- |
| `create_group_badge(data)` | `api_client.create_group_badge({"name": "Бейдж1", ...})` |
| `delete_group_badge(id)`   | `api_client.delete_group_badge(123)`                     |

### Приёмы пищи (feed-transaction)

| Метод                           | Пример                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `create_feed_transaction(data)` | `api_client.create_feed_transaction({"volunteer": 123, ...})` |
| `delete_feed_transaction(id)`   | `api_client.delete_feed_transaction(123)`                     |

### Кастомные поля

| Метод                       | Пример                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| `create_custom_field(data)` | `api_client.create_custom_field({"name": "поле1", "type": "string"})` |
| `delete_custom_field(id)`   | `api_client.delete_custom_field(123)`                                 |

### Справочники (неизменяемые данные из БД)

| Метод                   | Описание                  |
| ----------------------- | ------------------------- |
| `get_directions()`      | Список служб (directions) |
| `get_kitchens()`        | Список кухонь             |
| `get_access_roles()`    | Список ролей доступа      |
| `get_volunteer_roles()` | Список ролей волонтёров   |
| `get_feed_types()`      | Список типов питания      |

### История изменений

| Метод                                                     | Описание                                       |
| --------------------------------------------------------- | ---------------------------------------------- |
| `get_history(volunteer_uuid, params)`                     | Получить историю изменений волонтёра           |
| `wait_for_block_history_actions(uuid, sequence, timeout)` | Ждать появления записей бана/разбана в истории |

## Авторизация

По умолчанию клиент использует **админский токен** (автоматически получается при создании фикстуры).

### Смена авторизации

Если нужно сделать запрос от имени другого пользователя (например, через QR-код руководителя службы):

```python
# Установить QR-токен
api_client.set_qr_token("abc123")

# Теперь все запросы пойдут с заголовком Authorization: V-TOKEN abc123
api_client.set_block_state(456, True)

# Вернуться к админской авторизации
api_client.authenticate_admin()
```

### Полная очистка авторизации

```python
api_client.clear_auth()
# Теперь запросы без заголовка Authorization
```

## Где хранится URL API

URL определяется автоматически:

- **Локальная разработка (Docker)**: `http://localhost:8000` (API)
- **Стенд/прод**: берётся из переменной окружения `FEED_APP_HOST`

Настройка в файле `tests/constants.py`.

## Примеры использования

### Создать волонтёра и удалить после теста

```python
@pytest.fixture
def test_volunteer(api_client):
    volunteer = api_client.create_volunteer({
        "name": "Тестовый",
        "directions": ["uuid-службы"],
        "kitchen": 1,
        "qr": "qr123"
    })
    yield volunteer
    api_client.delete_volunteer(volunteer["id"])
```

### Проверить, что заблокированный волонтёр не может зайти

```python
def test_blocked_volunteer(api_client, test_volunteer):
    api_client.set_block_state(test_volunteer["id"], True)
    response = api_client.get_raw(
        f"/volunteers/{test_volunteer['id']}/",
        headers={"Authorization": f"V-TOKEN {test_volunteer['qr']}"}
    )
    assert response.status_code in (403, 404)
```

### Проверить историю бана

```python
def test_ban_history(api_client, test_volunteer):
    api_client.set_block_state(test_volunteer["id"], True)
    api_client.set_block_state(test_volunteer["id"], False)
    api_client.wait_for_block_history_actions(test_volunteer["uuid"])
```

## Фикстуры с тестовыми данными

В `conftest.py` уже созданы готовые фикстуры, которые создают и удаляют данные автоматически:

- `test_volunteer` — обычный волонтёр
- `test_direction_head` — волонтёр с ролью DIRECTION_HEAD
- `direction_pair` — пара: руководитель + подчинённый
- `qr_login_volunteer` — волонтёр для QR-входа
- `test_group_badge` — групповой бейдж
- `test_custom_field` — кастомное поле

Пример:

```python
def test_example(test_volunteer):
    # test_volunteer — уже созданный волонтёр
    print(test_volunteer["name"])
    # После теста волонтёр автоматически удалится
```
