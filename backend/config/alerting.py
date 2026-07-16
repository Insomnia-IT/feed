import logging
import os
import queue
import threading
import time

import requests
from config.observability import redact

logger = logging.getLogger(__name__)
_queue = queue.Queue(maxsize=100)
_last_sent = {}
_delivery_state = {"status": "unknown", "reason": "no_delivery_attempt"}


def notify(*, key, severity, message, recovered=False, request_id=None, sync_run_id=None):
    payload = redact({
        "deduplication_key": key,
        "severity": severity,
        "message": message[:500],
        "recovered": recovered,
        "environment": os.getenv("APP_ENVIRONMENT", "development"),
        "release": os.getenv("APP_RELEASE", os.getenv("COMMIT_SHA", "unknown")),
        "request_id": request_id,
        "sync_run_id": sync_run_id,
    })
    cooldown = int(os.getenv("ALERT_COOLDOWN_SECONDS", "900"))
    now = time.monotonic()
    if not recovered and now - _last_sent.get(key, 0) < cooldown:
        return False
    try:
        _queue.put_nowait(payload)
        _last_sent[key] = now
        return True
    except queue.Full:
        logger.warning("alert_queue_full", extra={"error_category": "alert_queue_full"})
        return False


def _deliver(payload):
    url = os.getenv("MATRIX_WEBHOOK_URL", "")
    if not url:
        _delivery_state.update(status="disabled", reason="matrix_not_configured")
        return False
    try:
        requests.post(url, json=payload, timeout=(3, 5)).raise_for_status()
        _delivery_state.update(status="ok", reason="last_delivery_succeeded")
        return True
    except requests.RequestException as exc:
        logger.warning("matrix_alert_failed", extra={"error_category": type(exc).__name__})
        _delivery_state.update(status="degraded", reason=type(exc).__name__)
        return False


def delivery_health():
    if not os.getenv("MATRIX_WEBHOOK_URL"):
        return {"status": "disabled", "reason": "matrix_not_configured"}
    return dict(_delivery_state)


def _worker():
    while True:
        payload = _queue.get()
        _deliver(payload)
        _queue.task_done()


threading.Thread(target=_worker, name="matrix-alerts", daemon=True).start()
