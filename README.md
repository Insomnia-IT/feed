# feed monorepo


# Установка backend
Windows
```bash
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Linux/MacOS
```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
pip install -r requirements.txt
```

# Установка frontend

```bash
yarn
```

# Запуск backend

Скопировать файл backend/.env.sample в backend/.env

Windows
```bash
cd backend
.\venv\Scripts\activate
python manage.py migrate
python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
python manage.py shell < create_user.py
python manage.py runserver localhost:8000
```

Linux/MacOS
```bash
cd ./backend
. ./venv/bin/activate
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
./manage.py shell < create_user.py
./manage.py runserver localhost:8000
```

# Запуск frontend с локальным беком

```bash
cd ./packages/admin
yarn run dev
```

```bash
cd ./packages/scanner
yarn run dev
```

# Запуск frontend со стейджовым беком

```bash
cd ./packages/admin
yarn run dev:stage
```

## Passwords

```bash
admin / Kolombina25
```

# Сборка

```bash
yarn run build
```

# Создание миграции БД
Linux/MacOS
```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
python manage.py makemigrations
```

## Локальный запуск через докер

Windows
```cmd
.\local-dev.cmd
```
Linux/MacOS
```bash
./local-dev.sh
```
