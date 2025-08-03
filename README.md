# feed monorepo

[Техническая документация](docs/overview.md)

# Установка frontend

Установить nodejs версии ^20.19.0 или старше. Для проверки текущей версии можно выполнить команду:

```bash
node -v
```

Установить пакеты:

```bash
npm install
```

# Запуск frontend со стейджовым беком (без локального запуска бекенда)

```bash
cd ./packages/admin
npm run dev:stage
```

# Если нужно локально запустить бек

## Установка backend

**Windows**

```bash
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Linux/MacOS**

```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
pip install -r requirements.txt
```

## Запуск backend

Скопировать файл `backend/.env.sample` в `backend/.env`

**Windows**

```bash
cd backend
.\venv\Scripts\activate
python manage.py migrate
python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
python manage.py shell < create_user.py
python manage.py runserver localhost:8000
```

**Linux/MacOS**

```bash
cd ./backend
. ./venv/bin/activate
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
./manage.py shell < create_user.py
./manage.py runserver localhost:8000
```

## Запуск frontend с локальным беком

```bash
cd ./packages/admin
npm run dev
```

```bash
cd ./packages/scanner
npm run dev
```

# Passwords

```bash
admin / Kolombina25
```

# Запуск линтера с автофиксом (если линтер упал на PR-е)

```bash
npm run lint-fix:js
```

# Сборка

```bash
npm run build
```

# Создание миграции БД

**Linux/MacOS**

```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
python manage.py makemigrations
```

# Локальный запуск через докер

**Windows**

```cmd
.\local-dev.cmd
```

**Linux/MacOS**

```bash
./local-dev.sh
```

# OpenApi дока
Swagger Ui можно найти тут: [локальный бекенд](http://localhost:8000/feedapi/v1), [стейдж](https://feedapp-dev.insomniafest.ru/feedapi/v1/)
