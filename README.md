# feed monorepo


## Локальный запуск через докер

Windows
```cmd
.\local-dev.cmd
```
Linux/MacOS
```bash
./local-dev.sh
```


# Установка
```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
pip install -r requirements.txt
```

```bash
yarn
```

# Запуск

Скопировать файл backend/.env.sample в backend/.env

```bash
cd ./backend
. ./venv/bin/activate
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders
./manage.py shell < create_user.py
./manage.py runserver localhost:8000
```

```bash
cd ./packages/admin
yarn run dev
```

```bash
cd ./packages/scanner
yarn run dev
```

## Admin

```bash
admin / admin
```

# Сборка

```bash
yarn run build
```

# Создание микграции БД

```bash
cd ./backend
python3 -m venv venv
. ./venv/bin/activate
python manage.py makemigrations
```
