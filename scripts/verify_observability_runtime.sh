#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT="feed-observability-gate-$$"
TMP=$(mktemp -d)
PORT=${OBSERVABILITY_GATE_PORT:-18080}
COMPOSE=(docker compose --project-name "$PROJECT" --env-file "$TMP/gate.env" -f "$ROOT/docker-compose.opensearch.yml" -f "$TMP/gate.override.yml")
cleanup() { "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
pass() { printf 'PASS %-30s %s\n' "$1" "${2:-}"; }
fail() { printf 'FAIL %-30s %s\n' "$1" "$2" >&2; exit 1; }

command -v docker >/dev/null || fail prerequisites "docker missing"
command -v curl >/dev/null || fail prerequisites "curl missing"
docker compose version >/dev/null || fail prerequisites "Compose v2 missing"
mkdir -p "$TMP/data" "$TMP/photos"
cat >"$TMP/gate.env" <<EOF
PORT=$PORT
DB_DIR=$TMP/data
PHOTO_STORAGE_PATH=$TMP/photos
PHOTO_AUTH_TOKEN=synthetic-photo-token
OPEN_SEARCH_PASSWORD=Synthetic-Only-9x7q-Change-Me
OPEN_SEARCH_USER_NAME=admin
SKIP_BACK_SYNC=True
EOF
cat >"$TMP/gate.override.yml" <<'EOF'
services:
  backend:
    environment:
      APP_ENVIRONMENT: runtime-gate
      APP_RELEASE: synthetic-runtime-gate
      DISABLE_CRON: "True"
      CREATE_INITIAL_USER: "False"
      DIAGNOSTICS_HMAC_KEY: synthetic-runtime-hmac
      HEALTH_DEPENDENCIES_TOKEN: synthetic-health-token
      METRICS_TOKEN: synthetic-metrics-token
      OTEL_ENDPOINT: http://jaeger:4318/v1/traces
      MATRIX_WEBHOOK_URL: http://matrix-unavailable.invalid/hook
      SYNCHRONIZATION_URL: http://slow-sync:18001/
    depends_on:
      slow-sync: {condition: service_started}
  slow-sync:
    image: python:3.12-alpine
    networks: [internal]
    command: [python, -c, "import json,time; from http.server import BaseHTTPRequestHandler,HTTPServer; H=type('H',(BaseHTTPRequestHandler,),{'do_GET':lambda s:(time.sleep(20),s.send_response(200),s.send_header('Content-Type','application/json'),s.end_headers(),s.wfile.write(json.dumps({'data':[],'next':None}).encode())),'log_message':lambda *a:None}); HTTPServer(('0.0.0.0',18001),H).serve_forever()"]
EOF

"${COMPOSE[@]}" config --quiet && pass compose_config
"${COMPOSE[@]}" build && pass compose_build
"${COMPOSE[@]}" up -d && pass compose_start
deadline=$((SECONDS + 240)); backend_health=unknown; front_health=unknown
while (( SECONDS < deadline )); do
  backend_health=$("${COMPOSE[@]}" ps --format json backend 2>/dev/null | grep -o '"Health":"[^"]*"' || true)
  front_health=$("${COMPOSE[@]}" ps --format json front 2>/dev/null | grep -o '"Health":"[^"]*"' || true)
  [[ $backend_health == *healthy* && $front_health == *healthy* ]] && break
  sleep 3
done
[[ $backend_health == *healthy* && $front_health == *healthy* ]] || fail container_health "backend=$backend_health front=$front_health"
pass container_health

logs=$("${COMPOSE[@]}" logs backend)
grep -q 'Booting worker' <<<"$logs" || fail gunicorn_startup "worker log absent"
! grep -q -- '--preload' <<<"$logs" || fail gunicorn_startup "unsafe preload"
pass gunicorn_startup
"${COMPOSE[@]}" exec -T backend curl -fsS http://127.0.0.1:8000/health/live >/dev/null && pass backend_live
"${COMPOSE[@]}" exec -T backend curl -fsS http://127.0.0.1:8000/health/ready >/dev/null && pass backend_ready
code=$("${COMPOSE[@]}" exec -T backend curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/health/dependencies)
[[ $code == 404 ]] || fail dependencies_permission "expected=404 actual=$code"; pass dependencies_permission
code=$("${COMPOSE[@]}" exec -T backend curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/metrics)
[[ $code == 404 ]] || fail metrics_permission "expected=404 actual=$code"
"${COMPOSE[@]}" exec -T backend curl -fsS -H 'Authorization: Bearer synthetic-metrics-token' http://127.0.0.1:8000/metrics >/dev/null || fail metrics_internal "authorized scrape failed"
pass metrics_permissions
curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null && pass frontend_health
curl -fsS "http://127.0.0.1:$PORT/scanner/" >/dev/null && pass scanner_available

bindings=$(docker inspect "$PROJECT-jaeger-1" "$PROJECT-opensearch-1" "$PROJECT-dashboard-1" "$PROJECT-prometheus-1" --format '{{json .HostConfig.PortBindings}}')
! grep -q '"HostIp":"0.0.0.0"' <<<"$bindings" || fail monitoring_bindings "$bindings"; pass monitoring_bindings
"${COMPOSE[@]}" stop jaeger >/dev/null
"${COMPOSE[@]}" exec -T backend curl -fsS http://127.0.0.1:8000/health/live >/dev/null || fail otel_unavailable "API failed"; pass otel_unavailable
"${COMPOSE[@]}" exec -T backend python manage.py shell -c "from config.alerting import notify; notify(key='runtime-matrix', severity='warning', message='synthetic runtime alert')" >/dev/null
"${COMPOSE[@]}" exec -T backend curl --max-time 5 -fsS http://127.0.0.1:8000/health/live >/dev/null || fail matrix_unavailable "API delayed or failed"; pass matrix_unavailable

kitchen_id=$("${COMPOSE[@]}" exec -T backend python manage.py shell -c "from feeder.models import Kitchen; print(Kitchen.objects.create(name='Runtime gate', pin_code='synthetic-runtime-pin').id)" | tail -1 | tr -d '\r')
"${COMPOSE[@]}" exec -T backend python manage.py run_external_sync >/dev/null 2>&1 & slow_pid=$!
sleep 2; start=$(date +%s%3N)
payload=$(printf '{"last_updated":null,"kitchen_id":%s,"transactions":[{"ulid":"01RUNTIMEGATE000000000000001","volunteer":null,"amount":1,"dtime":"2026-01-01T00:00:00Z","meal_time":"lunch","is_vegan":false,"is_paid":false,"is_anomaly":false,"kitchen":%s}]}' "$kitchen_id" "$kitchen_id")
code=$("${COMPOSE[@]}" exec -T backend curl -sS -o /dev/null -w '%{http_code}' -H 'Authorization: K-PIN-CODE synthetic-runtime-pin' -H 'Content-Type: application/json' --data "$payload" http://127.0.0.1:8000/feedapi/v1/feed-transaction/sync)
latency=$(( $(date +%s%3N) - start ))
[[ $code == 200 && $latency -lt 5000 ]] || fail slow_sync_isolation "status=$code latency_ms=$latency"
wait "$slow_pid" || true; pass slow_sync_isolation "status=$code latency_ms=$latency"
"${COMPOSE[@]}" restart backend >/dev/null; sleep 10
"${COMPOSE[@]}" exec -T backend curl -fsS http://127.0.0.1:8000/health/live >/dev/null || fail graceful_restart "live failed"; pass graceful_restart
"${COMPOSE[@]}" stop --timeout 30 backend >/dev/null && pass graceful_stop
printf '\nRESULT CODE_REVIEW_READY, RUNTIME_GATE_PASSED\n'
