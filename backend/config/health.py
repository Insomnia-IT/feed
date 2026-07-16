import os
import shutil
import time
from pathlib import Path

from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.utils import timezone


def _database():
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()


def _writable_directory(path):
    directory = Path(path).resolve()
    if not directory.is_dir() or not os.access(directory, os.W_OK):
        raise PermissionError("directory_not_writable")
    return directory


@require_GET
def live(request):
    return JsonResponse({"status": "ok"})


@require_GET
def ready(request):
    checks = {}
    try:
        _database()
        checks["sqlite"] = "ok"
        executor = MigrationExecutor(connection)
        checks["migrations"] = "ok" if not executor.migration_plan(executor.loader.graph.leaf_nodes()) else "pending"
        db_dir = _writable_directory(Path(settings.DATABASES["default"]["NAME"]).parent)
        _writable_directory(settings.PHOTO_STORAGE_PATH)
        minimum = int(os.getenv("HEALTH_MIN_DISK_FREE_BYTES", str(100 * 1024 * 1024)))
        checks["disk"] = "ok" if shutil.disk_usage(db_dir).free >= minimum else "low"
        checks["photos"] = "ok"
    except Exception as exc:
        checks.setdefault("error", type(exc).__name__)
    ok = all(value == "ok" for value in checks.values())
    return JsonResponse({"status": "ok" if ok else "not_ready", "checks": checks}, status=200 if ok else 503)


@require_GET
def dependencies(request):
    configured = os.getenv("HEALTH_DEPENDENCIES_TOKEN", "")
    if not configured or request.headers.get("Authorization") != f"Bearer {configured}":
        return JsonResponse({"detail": "not found"}, status=404)
    from synchronization.models import SynchronizationSystemActions
    from config.alerting import delivery_health
    try:
        _database()
        sqlite = {"status": "ok", "reason": "select_1_succeeded"}
    except Exception as exc:
        sqlite = {"status": "failed", "reason": type(exc).__name__}

    def sync_health(direction, enabled=True):
        if not enabled:
            return {"status": "disabled", "reason": "sync_direction_disabled"}
        latest = SynchronizationSystemActions.objects.filter(direction=direction).order_by("-date", "-id").first()
        if not latest:
            return {"status": "unknown", "reason": "no_sync_record"}
        if not latest.success:
            return {"status": "failed", "reason": latest.error_category or "last_sync_failed"}
        age = max(0, (timezone.now() - latest.date).total_seconds())
        threshold = int(os.getenv("SYNC_LAG_ALERT_SECONDS", "1800"))
        return {"status": "ok" if age <= threshold else "degraded", "reason": "last_sync_recent" if age <= threshold else "sync_stale"}

    def heartbeat_health(env_name, default_path, disabled=False):
        if disabled:
            return {"status": "disabled", "reason": "component_disabled"}
        path = os.getenv(env_name, default_path)
        if not os.path.exists(path):
            return {"status": "unknown", "reason": "heartbeat_missing"}
        age = max(0, time.time() - os.path.getmtime(path))
        threshold = int(os.getenv("HEARTBEAT_STALE_SECONDS", "1800"))
        return {"status": "ok" if age <= threshold else "degraded", "reason": "heartbeat_recent" if age <= threshold else "heartbeat_stale"}

    try:
        free = shutil.disk_usage(Path(settings.DATABASES["default"]["NAME"]).parent).free
        threshold = int(os.getenv("HEALTH_MIN_DISK_FREE_BYTES", str(100 * 1024 * 1024)))
        disk = {"status": "ok" if free >= threshold else "failed", "reason": "space_available" if free >= threshold else "disk_below_threshold"}
    except Exception as exc:
        disk = {"status": "unknown", "reason": type(exc).__name__}
    result = {
        "incoming_sync": sync_health(SynchronizationSystemActions.DIRECTION_FROM_SYSTEM, bool(settings.SYNCHRONIZATION_URL)),
        "reverse_sync": sync_health(SynchronizationSystemActions.DIRECTION_TO_SYSTEM, bool(settings.SYNCHRONIZATION_URL) and not settings.SKIP_BACK_SYNC),
        "cron_heartbeat": heartbeat_health("CRON_HEARTBEAT_FILE", "/tmp/feed-cron-success", os.getenv("DISABLE_CRON") == "True"),
        "photo_sync": heartbeat_health("PHOTO_SYNC_HEARTBEAT_FILE", "/tmp/feed-photo-sync-success", os.getenv("DISABLE_CRON") == "True"),
        "disk": disk,
        "sqlite": sqlite,
        "opentelemetry": {"status": "unknown", "reason": "exporter_delivery_not_observed"} if os.getenv("OTEL_ENDPOINT") else {"status": "disabled", "reason": "endpoint_not_configured"},
        "alert_delivery": delivery_health(),
    }
    states = {item["status"] for item in result.values()}
    overall = "failed" if "failed" in states else "degraded" if "degraded" in states else "unknown" if "unknown" in states else "ok"
    return JsonResponse({"status": overall, "dependencies": result})


healthz = ready
