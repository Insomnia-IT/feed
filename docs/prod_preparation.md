# Подготовка продового сервера к фестивалю

# Очистка базы данных прошлого года

Зайти на сервер. Пароль узнать у Дарка.

```console
ssh -p 17230 administrator@redmine.cb27.ru
```

Зайти в директорию баз данных

```console
cd /var/feed_db/
```

Сделать бекап текущей базы:

```console
cp feed_db.sqlite3 feed_db.{prev_year}.sqlite3.bak
```

Вместо {prev_year} подставить прошлый год, например 2025

Удалить базу:

```console
sudo rm feed_db.sqlite3
```

Переместить директорию фотографий прошлого года:

```console
sudo mv ./photos ./photos_{prev_year}
```

Вместо {prev_year} подставить прошлый год, например 2025

Открыть https://github.com/Insomnia-IT/feed/actions/workflows/testprod_deploy.yml

Нажать Run workflow -> Branch: main -> Run workflow

Запустится пайплайн и зарелизит последнюю версию приложения.

Открыть https://redmine.cb27.ru:17444/, авторизоваться логином/паролем admin/Kolombina25

Зайти в https://redmine.cb27.ru:17444/admin и изменить пароль на новый секретный, который будет только у нескольких людей.

Открыть Сихронизацию и нажать "Синхронизация с Notion"

Посмотреть, что нет ошибок и появились волонтеры
