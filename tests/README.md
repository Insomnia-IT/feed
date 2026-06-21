# insomnia-autotests

# регресс тесты

### Используем

pytest, playwight

## Запуск

```bash
# получить окружение и либы
python -m venv venv
. venv/bin/activate
pip install -r requirements.txt

python -m pytest # запустить тесты в файлах test_***.py
python -m pytest test_regress.py # запустить тесты в конкретных файлах
```

## Запуск в докере

```bash
. run_tests.sh
или
bash -c ". run_tests.sh" ; echo "exit_code is $?"
```

## Отладка конкретного теста

Запуск админки:

```bash
cd ./packages/admin
npm run dev:stage
```

Запуск теста:

```bash
cd tests
. venv/bin/activate

FEED_APP_HOST=http://localhost:3002 python -m pytest --headed test_regress.py::test_create_new_user
```

test_create_new_user заменяем на свой конкретный тест. При запуске открывается реальный браузер и видно что происходит

Сохранение волонтёра в e2e: `data-testid="volunteer-save-button"` (плавающая кнопка) и
`data-testid="volunteer-save-confirm"` (модалка «Всё равно сохранить»). Хелпер `save_in_user_page`
ждёт, пока кнопка станет enabled, и кликает последнюю кнопку «Сохранить» на странице.

Если после push CI на PR не стартует — закройте и откройте PR заново (триггер `reopened`).

`wait_for_volunteers_count` использует `page.wait_for_function` с inline-значением (без второго positional arg — иначе TypeError в playwright Python).

`test_create_new_meal` сверяет дату в таблице с `Europe/Moscow` — как в админке (`formatInAppTimeZone`), не с UTC контейнера CI.
