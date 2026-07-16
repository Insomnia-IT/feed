import json
import logging
import os
import re
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

from django.urls import resolve, Resolver404


request_id_var = ContextVar("request_id", default=None)
SENSITIVE_KEY = re.compile(
    r"authorization|cookie|password|passwd|pin|qr|token|dsn|secret|phone|email|photo|first_name|last_name|name",
    re.IGNORECASE,
)
SENSITIVE_STRING_PATTERNS = (
    re.compile(r"(?i)\b(Bearer|K-PIN-CODE|V-TOKEN)\s+[^\s,;]+"),
    re.compile(r"(?i)\b(authorization|cookie|password|passwd|pin|qr|token|dsn|secret|phone|email)\s*[:=]\s*[^\s,;&]+"),
    re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    re.compile(r"(?<![\w-])(?:\+\d[\d ()-]{8,}\d|\d[\d ()]{8,}\d)(?![\w-])"),
)


def redact_string(value):
    result = value
    for pattern in SENSITIVE_STRING_PATTERNS:
        result = pattern.sub("[REDACTED]", result)
    return result


def redact(value, key=""):
    if SENSITIVE_KEY.search(str(key)):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {str(k): redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [redact(v) for v in value]
    if isinstance(value, str):
        return redact_string(value)
    return value


def safe_request_id(value):
    if value and re.fullmatch(r"[A-Za-z0-9._-]{1,128}", value):
        return value
    return str(uuid.uuid4())


def trace_id():
    try:
        from opentelemetry import trace

        context = trace.get_current_span().get_span_context()
        if context.is_valid:
            return format(context.trace_id, "032x")
    except Exception:
        pass
    return None


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "environment": os.getenv("APP_ENVIRONMENT", "development"),
            "service": os.getenv("OTEL_SERVICE_NAME", "feed-backend"),
            "release": os.getenv("APP_RELEASE", os.getenv("COMMIT_SHA", "unknown")),
            "request_id": getattr(record, "request_id", None) or request_id_var.get(),
            "trace_id": getattr(record, "trace_id", None) or trace_id(),
            "message": record.getMessage(),
        }
        for field in ("route", "method", "status", "duration_ms", "error_category", "sync_run_id"):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["error_category"] = payload.get("error_category") or record.exc_info[0].__name__
        return json.dumps(redact(payload), ensure_ascii=False, default=str)


def normalized_route(request):
    try:
        match = resolve(request.path_info)
        return f"/{match.route}" if match.route else "/"
    except Resolver404:
        return "unmatched"


class RequestObservabilityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger("feed.http")

    def __call__(self, request):
        request_id = safe_request_id(request.headers.get("X-Request-ID"))
        request.request_id = request_id
        token = request_id_var.set(request_id)
        started = time.monotonic()
        response = None
        try:
            response = self.get_response(request)
            return response
        except Exception as exc:
            self.logger.exception("request_failed", extra={
                "route": normalized_route(request), "method": request.method,
                "status": 500, "error_category": type(exc).__name__,
            })
            raise
        finally:
            status = getattr(response, "status_code", 500)
            if response is not None:
                response["X-Request-ID"] = request_id
            self.logger.info("request_completed", extra={
                "route": normalized_route(request), "method": request.method,
                "status": status, "duration_ms": round((time.monotonic() - started) * 1000, 2),
            })
            request_id_var.reset(token)


def sentry_before_send(event, hint):
    event.pop("request", None)
    event.pop("user", None)
    event.pop("breadcrumbs", None)
    return redact(event)
