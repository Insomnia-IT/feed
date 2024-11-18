## Техническая документация

### Используемый стек

Фронтенд: React + nextjs + refine + antd
Бекенд: python + django
База данных: sqlite3

## Бекенд

Бекенд располагается в папке backend. Используется язык python, фреймворк - [django](https://www.djangoproject.com/).

Пример Pull Request-а c добавлением полей в базу данных: https://github.com/Insomnia-IT/feed/pull/387/files

Подробная документация по бекенду располагается по [ссылке](backand%2description.md)

## Фронтенд

Фронденд написан на React.

Проект фронтенда сделан как монорепозиторий и состоит из двух приложений:
- [Админка](#админка). Располагается в packages/admin.
- [Сканнер/Кормитель](#сканнер). Располагается в packages/scanner.

Админка написана с использованием фреймворка [Refine](https://refine.dev/). Фреймворк задает лейаут приложения, навигацию и шаблоны для страниц CRUD операций.
Используется библиотека виджетов [Ant Design](https://ant.design/components/overview/).

### Админка

Примеры Pull Request-ов: 
- Обязательный комментарий при бане волонтера. https://github.com/Insomnia-IT/feed/pull/353/files
- Возможность банить волонтеров для руководителя локации. https://github.com/Insomnia-IT/feed/pull/363/files


### Сканнер

Примеры Pull Request-ов: 
- Возможность учесть группу покормленных анонимов. https://github.com/Insomnia-IT/feed/pull/189/files
- Фиксы сканера. https://github.com/Insomnia-IT/feed/pull/195
