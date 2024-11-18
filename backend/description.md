## Feed-backend

### Содержание
* [Config](#Config)
* [Cron tasks](#CronTasks)
* [Feeder](#Feeder)
* [History](#History)
* initial
* shared
* synchronization

### Config
Модуль с конфигурациооными настройками Django проекта
* [admin.py](config%2Fadmin.py) - файл содержит настройки и регистрации всех моделей проекта в админе панели
* [get_request.py](config%2Fget_request.py) - Содержит класс RequestMiddleware который предоставляет текущий запрос
для текущей сессии. С его помощью можно получить к примеру пользователя внутри view (user = current_request().user)
* [settings.py](config%2Fsettings.py) - Файл с основными настройками Django проекта
* [urls.py](config%2Furls.py) - Файл с основными url проекта

### CronTasks
Модуль содержит периодически исполняемые скрипты запускаемые с помощью CRON. \
Создание задач на запуск происходит в файле [cron_config.py](cron_config.py) .
Данный файл запускается из [docker-compose.yaml](docker-compose.yaml) перед запуском основного приложения
* [auto_sync.py](cron_tasks%2Fauto_sync.py) - Отправояет запрос на url синхронизации

### Feeder
Содержит основные модели, сериалайзеры и вью проекта
* [admin.py](feeder%2Fadmin.py) - файл содержит настройки и регистрации моделей в админе панели
* [authentication.py](feeder%2Fauthentication.py) - Содержит классы аутентификации применяемые в проекте \
В проете переопределена аутентификация, вся аутентификция для работы через запросы ведется через QR-коды
* [mixins.py](feeder%2Fmixins.py) - который предоставляет методы, поля моделей для использования в других моделях
* [models.py](feeder%2Fmodels.py) - описание основных моделей проекта
* [serializers.py](feeder%2Fserializers.py) - описание основных сериалайзеров проекта
* [views](feeder%2Fviews) - описание представлений основных моделей проекта
* [soft_delete.py](feeder%2Fsoft_delete.py) - механизм мягкого удаления обьектов. Основан на миксине моделей,
замещает метод delete
* [sync_serializers.py](feeder%2Fsync_serializers.py) - сериалайзеры формирующие данные на основе данных из моделей
для сохранения в истории и последующей синхрнизации
* [urls.py](feeder%2Furls.py) - url модуля
* [utils.py](feeder%2Futils.py) - утилиты используемые в модуле

### <a name="History">History</a>
модуль содержит модель, сериалайзер и представление для сохранения и возвращения истории
изменения обьектов основных моделей проекта. \
Сохранение данных производиться на основе SaveHistoryDataViewSetMixin ([mixins.py](feeder%2Fviews%2Fmixins.py))

### Initial

