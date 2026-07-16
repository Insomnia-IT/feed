# Проверка observability-изменений

Дата: 2026-07-16. Ветка: `health-check`. Base commit относительно `origin/main`: `bec016bcaa28897c377432411b7a1886705ac93f`. Исходный HEAD до проверочного прохода: `fc3cba1f53e385891d5d9d6ba8e6ea2666a15196`.

Все данные синтетические. Production, внешние API и реальные credentials не использовались.

## Доказано локально

- Requirements установлены в чистый `.venv-observability`.
- `manage.py check`, `makemigrations --check --dry-run`, `migrate --plan` проходят с exit 0.
- Чистая SQLite мигрируется с нуля; повторный migrate идемпотентен.
- Upgrade с feeder 0079/synchronization 0005 сохраняет существующие `SynchronizationSystemActions` и `FeedTransaction.ulid`; после upgrade создаются 2000 diagnostics events.
- 56 Django tests и 13 scanner Vitest tests проходят. Добавлены producer assertions, truthful dependency states, sync dispatch lifecycle/concurrency и bounded API probe scenarios.
- Два параллельных scanner transaction sync завершаются 200 после bounded SQLite retry; два ULID сохранены без дублей.
- Diagnostics batch из 50 событий одновременно с кормлением: diagnostics 200 примерно за 15 ms, кормление 200 примерно за 62 ms; monitoring lock возвращает 503 и не подтверждает client batch.
- Partial invalid batch полностью отклоняется и не записывает валидную часть.
- Dexie transitions 19/20/21/22 → 23 сохраняют каждый pending `is_new=true` ULID.
- Offline diagnostics остаются в IndexedDB и отправляются после online; diagnostics cleanup не затрагивает transactions.
- WSGI import с недоступным локальным OTel endpoint инициализирует provider (`configured=True`, service `feed-backend`) и не мешает startup.
- OTel server/client hooks принудительно заменяют query-bearing URL attributes на path-only значения; generic request/response header capture отключён независимо от deployment env.
- Отдельный management sync с искусственной задержкой 20 секунд завершился за 23.1 секунды. Пока он выполнялся: live 22 ms/200, ready 25 ms/200, volunteers 18 ms/200, transaction sync 30 ms/200, diagnostics 22 ms/200.

## Не доказано в этой среде

Docker CLI отсутствует, WSL не установлен, а Gunicorn не запускается нативно на Windows из-за отсутствия `fcntl`. Поэтому не доказаны фактический Docker build, container health status, effective Compose bindings из отдельного контейнера и graceful Gunicorn shutdown. Статические tests проверяют loopback bindings monitoring, отсутствие backend host ports, arbitrary Real-IP trust и `$request_uri` в access log. Эти пункты остаются release blockers до Linux/CI Compose-прогона. Credential-файлы намеренно оставлены без изменений относительно HEAD; найденные defaults остаются отдельным technical debt.

## Fault injection

| Сценарий                                | Поведение                                             | Health/данные                                                     | Восстановление                                  |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| readonly photo/DB directory             | ready 503                                             | live 200, feeding process остаётся жив                            | вернуть write permissions; ready становится 200 |
| disk full                               | ready 503                                             | live 200                                                          | освободить место, повторить ready               |
| SQLite locked                           | scanner sync делает 3 короткие попытки; затем 503     | локальный ULID не подтверждается; `feed_sqlite_busy_total` растёт | автоматический повтор scanner                   |
| DNS/refused/TLS/slow/hang external sync | отдельный command завершается ошибкой категории       | web API не занят; Sync row не содержит исходное сообщение         | исправить сеть и повторить command              |
| OTel unavailable                        | WSGI запускается; BatchSpanProcessor best effort      | readiness не зависит от OTel                                      | exporter восстанавливается независимо           |
| Matrix timeout/500                      | `_deliver` возвращает false, HTTP/sync не ждёт worker | in-memory best-effort alert может быть потерян                    | следующий alert после cooldown/recovery         |
| Prometheus unavailable                  | pull-система не является dependency backend           | live/ready не меняются                                            | Prometheus возобновляет scrape                  |

Disk-full и readonly проверены контролируемыми fault mocks в Django tests; сетевые ошибки — исключениями `requests` соответствующих типов. Linux filesystem/container fault injection всё ещё обязателен перед release.

## Остаточный sync v1 риск

Входящие scanner batches идемпотентны по ULID и server cursor ограничен kitchen, однако cursor остаётся timestamp, а не opaque `(created_at, ULID)`. Сейчас endpoint возвращает все записи после cursor без pagination, поэтому одинаковый timestamp не теряется в протестированном сценарии. Любое будущее paging требует sync API v2; иначе граница с одинаковыми timestamp может пропустить запись.
