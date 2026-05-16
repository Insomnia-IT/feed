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

FEED_APP_HOST=http://localhost:3002 python -m pytest test_regress.py::test_create_new_user
```

test_create_new_user заменяем на свой конкретный тест. При запуске открывается реальный браузер и видно что происходит
