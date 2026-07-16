# Healthchecks and Flap Diagnostics

## Endpoints

- `GET /healthz` is served by nginx and returns `200 ok`.
- `GET /feedapi/v1/healthz` is served by Django and runs `SELECT 1` against the default database.

Backend responses:

- healthy: `{"status": "ok", "db": "ok"}`
- unhealthy DB: `503 {"status": "unhealthy", "db": "error"}`

## Logs

Nginx writes access logs to stdout and error logs to stderr so they are available through `docker logs`.
Access log entries include request time, upstream timing/status/address, bytes sent, and `request_id`.
If the client sends `X-Request-ID`, nginx reuses it; otherwise nginx uses its own `$request_id`.

## Docker Healthchecks

The compose files define healthchecks for:

- `backend`: `http://localhost:8000/feedapi/v1/healthz`
- `front`: `http://localhost/healthz`

The `localhost` URLs are intentional because healthchecks run inside each container.

## Out of Scope

This patch does not change the backend runtime, deployment strategy, startup order, or `runserver`.
Replacing `runserver`, adding graceful shutdown, and implementing rolling/blue-green deploys are separate tasks.
