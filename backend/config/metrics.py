import os
import shutil
import time
from collections import deque

from django.conf import settings
from django.http import HttpResponse
from django.urls import resolve, Resolver404
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

HTTP_REQUESTS = Counter("feed_http_requests_total", "HTTP requests", ["method", "route", "status"])
HTTP_DURATION = Histogram("feed_http_request_duration_seconds", "HTTP request duration", ["method", "route"])
EXCEPTIONS = Counter("feed_backend_exceptions_total", "Backend exceptions", ["category"])
SQLITE_BUSY = Counter("feed_sqlite_busy_total", "SQLite busy/locked errors")
SYNC_ATTEMPTS = Counter("feed_sync_attempts_total", "Sync attempts", ["direction", "trigger"])
SYNC_DURATION = Histogram("feed_sync_duration_seconds", "Sync duration", ["direction"])
SYNC_ITEMS = Counter("feed_sync_items_total", "Sync items", ["direction", "result"])
SYNC_FAILURES = Counter("feed_sync_failures_total", "Sync failures", ["direction", "category"])
SYNC_RESULTS = Counter("feed_sync_results_total", "Sync results", ["direction", "result"])
SYNC_CONSECUTIVE = Gauge("feed_sync_consecutive_failures", "Consecutive sync failures", ["direction"])
SYNC_LAST_SUCCESS = Gauge("feed_sync_last_success_timestamp_seconds", "Last successful sync", ["direction"])
SYNC_LAG = Gauge("feed_sync_lag_seconds", "Sync lag", ["direction"])
DISK_FREE = Gauge("feed_disk_free_bytes", "Free disk bytes", ["volume"])
CRON_LAST_SUCCESS = Gauge("feed_cron_last_success_timestamp_seconds", "Cron last success")
CLIENT_HEARTBEATS = Counter("feed_client_heartbeats_total", "Client heartbeats", ["state"])
CLIENT_DEVICES = Gauge("feed_client_devices", "Recent client devices", ["state"])
DIAGNOSTICS_EVENTS = Counter("feed_diagnostics_events_total", "Diagnostics ingest events", ["outcome", "reason"])
CLIENT_PENDING_COUNT = Gauge("feed_client_pending_transactions", "Pending transactions reported by clients")
CLIENT_PENDING_AGE = Gauge("feed_client_oldest_pending_age_seconds", "Oldest pending transaction age reported by clients")
_sqlite_busy_times = deque(maxlen=100)


def record_sqlite_busy():
    SQLITE_BUSY.inc()
    now = time.monotonic()
    _sqlite_busy_times.append(now)
    while _sqlite_busy_times and now - _sqlite_busy_times[0] > 600:
        _sqlite_busy_times.popleft()
    if len(_sqlite_busy_times) >= int(os.getenv("SQLITE_BUSY_ALERT_THRESHOLD", "5")):
        from config.alerting import notify
        notify(key="sqlite-busy", severity="warning", message="SQLite busy threshold exceeded")


class MetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started = time.monotonic()
        try:
            response = self.get_response(request)
        except Exception as exc:
            EXCEPTIONS.labels(type(exc).__name__).inc()
            if "locked" in str(exc).lower() or "busy" in str(exc).lower():
                record_sqlite_busy()
            raise
        try:
            route = "/" + resolve(request.path_info).route
        except Resolver404:
            route = "unmatched"
        HTTP_REQUESTS.labels(request.method, route, str(response.status_code)).inc()
        HTTP_DURATION.labels(request.method, route).observe(time.monotonic() - started)
        return response


def metrics_view(request):
    configured = os.getenv("METRICS_TOKEN", "")
    if configured and request.headers.get("Authorization") != f"Bearer {configured}":
        return HttpResponse(status=404)
    database_path = settings.DATABASES["default"]["NAME"]
    volume = database_path if os.path.isdir(database_path) else os.path.dirname(database_path) or "."
    free = shutil.disk_usage(volume).free
    DISK_FREE.labels("database").set(free)
    if free < int(os.getenv("DISK_ALERT_FREE_BYTES", str(1024 * 1024 * 1024))):
        from config.alerting import notify
        notify(key="disk-low", severity="critical", message="Database volume free space is below threshold")
    heartbeat = os.getenv("CRON_HEARTBEAT_FILE", "/tmp/feed-cron-success")
    if os.path.exists(heartbeat):
        CRON_LAST_SUCCESS.set(os.path.getmtime(heartbeat))
    from synchronization.models import SynchronizationSystemActions
    for direction in (SynchronizationSystemActions.DIRECTION_FROM_SYSTEM, SynchronizationSystemActions.DIRECTION_TO_SYSTEM):
        latest = SynchronizationSystemActions.objects.filter(direction=direction, success=True).order_by("-date", "-id").first()
        if latest:
            lag = max(0, time.time() - latest.date.timestamp())
            SYNC_LAG.labels(direction).set(lag)
            if lag > int(os.getenv("SYNC_LAG_ALERT_SECONDS", "1800")):
                from config.alerting import notify
                notify(key=f"sync-lag-{direction}", severity="warning", message="External synchronization is stale")
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
