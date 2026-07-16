# Наблюдаемость и полевая диагностика

Система спроектирована fail-open относительно мониторинга: недоступность OTel, Prometheus или Matrix не блокирует кормление. Диагностические события отделены от пользовательских транзакций и никогда их не очищают.

## Конфигурация

Backend: `APP_ENVIRONMENT`, `APP_RELEASE`/`COMMIT_SHA`, `LOG_LEVEL`, `OTEL_SERVICE_NAME`, `OTEL_ENDPOINT`, `OTEL_TRACES_SAMPLE_RATE`, `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `METRICS_TOKEN`, `HEALTH_DEPENDENCIES_TOKEN`, `HEALTH_MIN_DISK_FREE_BYTES`, `SQLITE_TIMEOUT_SECONDS`, `DIAGNOSTICS_HMAC_KEY`.

Matrix webhook необязателен:

```env
MATRIX_WEBHOOK_URL=https://matrix-gateway.internal.example/hooks/feed
ALERT_COOLDOWN_SECONDS=900
APP_ENVIRONMENT=festival-local
APP_RELEASE=git-sha
```

URL webhook и credentials нельзя помещать в git или diagnostics. Alert queue ограничена, хранится только в памяти процесса и работает в daemon thread с коротким timeout. Это best-effort доставка: restart теряет ожидающие алерты. Для гарантированной доставки нужен Alertmanager либо отдельная durable queue.

`DIAGNOSTICS_HMAC_KEY` должен быть случайным секретом установки и храниться вне Git. При его отсутствии ingest возвращает 503, но Кормитель и очередь кормлений продолжают работать.

## Endpoints

| Endpoint                              | Доступ                             | Назначение                                                                                     |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /health/live`                    | public                             | Только факт работы Django; внешние системы и БД не проверяются.                                |
| `GET /health/ready`                   | public                             | SQLite `SELECT 1`, migrations, writable DB/photo directories, disk threshold. Grist не влияет. |
| `GET /health/dependencies`            | Bearer `HEALTH_DEPENDENCIES_TOKEN` | Раздельные состояния sync, cron, photo, disk, SQLite, OTel, Matrix; без URL/DSN.               |
| `GET /metrics`                        | optional Bearer `METRICS_TOKEN`    | Prometheus exposition. В production endpoint должен быть доступен только monitoring network.   |
| `POST /feedapi/v1/client-diagnostics` | `K-PIN-CODE`                       | До 50 строго проверенных обезличенных событий; dedupe, rate limit, retention 7 дней.           |

Внешняя синхронизация выполняется командой `python manage.py run_external_sync`, а не внутри web request. Административный POST `/feedapi/v1/notion-sync` только запускает отдельный процесс и возвращает 202; endpoint требует staff authentication. Cron вызывает management command напрямую.

Client batch содержит случайный installation ID, app version и события. Backend хранит только SHA-256 installation ID. Запрещены Authorization, cookies, PIN, QR, имена, телефоны, фото, bodies, token/DSN.

## Метрики

`feed_http_requests_total`, `feed_http_request_duration_seconds`, `feed_backend_exceptions_total`, `feed_sqlite_busy_total`, `feed_sync_attempts_total`, `feed_sync_results_total`, `feed_sync_duration_seconds`, `feed_sync_items_total`, `feed_sync_failures_total`, `feed_sync_consecutive_failures`, `feed_sync_last_success_timestamp_seconds`, `feed_sync_lag_seconds`, `feed_disk_free_bytes`, `feed_cron_last_success_timestamp_seconds`, `feed_diagnostics_events_total`, `feed_client_heartbeats_total`, `feed_client_pending_transactions`, `feed_client_oldest_pending_age_seconds`, `feed_client_devices`.

Producer status: HTTP/exception/SQLite/sync attempts, duration, processed, failures, consecutive failures, last success, lag, disk, cron heartbeat, diagnostics accepted/rejected, heartbeat and reported pending count/age are **implemented and tested**. `feed_client_devices` is **planned**, has no producer and is not used in rules. Pending gauges are **partial**: they represent the latest accepted heartbeat, not an exact fleet-wide sum.

Labels ограничены method, нормализованным route, status, direction, trigger, result/category/state. Device ID, ULID, kitchen ID и персональные ID labels не являются.

## Алерты

Rules в `jaeger/feed-alert-rules.yml`: backend down, HTTP 5xx growth и missing cron. Sync failure/recovery, sync lag, low disk, repeated SQLite busy и diagnostics rejection принадлежат application queue, чтобы не создавать два независимых источника одного alert. Readiness probe, active-kitchen heartbeat и TLS expiry остаются planned для защищённого внешнего monitor.

Ownership: application queue produces repeated sync failure/recovery, sync lag, disk low, repeated SQLite busy and diagnostics rejection anomaly. Prometheus owns backend down, HTTP 5xx rate and missing-cron rules. TLS expiry and external reachability are **planned** for a blackbox monitor. Matrix delivery is **implemented, runtime pending** and best-effort in-memory.

## Dependency health

`/health/dependencies` performs no external requests. Disk and SQLite are measured locally; sync state comes from `SynchronizationSystemActions`; cron/photo state comes from heartbeat files. Configured OTel is `unknown/exporter_delivery_not_observed` because delivery is not measurable here. Matrix reports its last actual delivery attempt, `unknown`, or `disabled`.

## Инструкция полевому дежурному

1. Сначала спросить: «Кормления сохраняются на устройстве?» Если локальная БД готова, продолжать кормление можно даже без сети.
2. Проверить `/health/live`, затем `/health/ready`. Не запускать full refresh и не очищать browser data, пока есть pending transactions.
3. Записать app version, обезличенный device ID, request ID, время и kitchen number; не просить PIN/QR/имя.
4. Проверить pending count и возраст oldest pending. При доступном backend ручной sync можно повторить: ULID делает повтор безопасным.
5. Full database refresh допустим только после подтверждения, что pending transaction count равен нулю.

## Когда Кормитель пишет Network Error

Проверить последовательно: browser `navigator.onLine`; доступность `/health/live`; readiness; DNS; TLS date/hostname; proxy upstream status/time; clock skew; затем request ID в Nginx JSON и backend JSON. `online=true` означает лишь наличие сетевого интерфейса, а не доступность API. При half-open/slow 3G axios завершит попытку через 15 секунд; транзакция остаётся в IndexedDB и повторяется после восстановления связи.

Если API доступен, но Grist stale, кормление продолжается по локальной базе; дежурный сообщает об устаревании данных отдельно. Если камера запрещена, разрешить camera permission и проверить secure context. Не очищать service worker/cache и IndexedDB одновременно.

## Ограничения текущей итерации

Scanner API probe is **implemented and tested**: 30-second interval, 3-second timeout, local liveness endpoint only. Sync stale/error and diagnostics upload failure are distinct. Camera, clock skew, Grist freshness and Service Worker state are **not implemented** and display `unknown`. Opaque v2 sync cursor is **planned**.

## Credentials status

Credential configuration is intentionally unchanged in this iteration and remains documented technical debt. Rotation and removal of repository defaults require a separate team-approved change.

## Upgrade и recovery

Перед frontend upgrade текущий код читает все `is_new=true` transactions из старой IndexedDB без повышения версии, затем открывает schema 23 и восстанавливает pending ULID через `bulkPut`. Проверяются переходы 19/20/21/22 → 23. Volunteers и groupBadges могут быть повторно загружены; pending FeedTransaction удалять нельзя.

Backend migrations являются forward-only для diagnostics. Перед deployment требуется локальная копия SQLite-файла при остановленном writer. При неуспешной миграции: остановить backend, сохранить неуспешный файл для анализа, восстановить предмиграционную копию, вернуть предыдущий release и запустить его. Не выполнять reverse migration после приёма `ClientDiagnosticEvent`: reverse удаляет новую таблицу. Business-таблица `FeedTransaction` и её ULID миграциями observability не изменяются.
