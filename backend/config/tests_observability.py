import json
import logging
import os
import tempfile
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings
from django.utils import timezone

from config.observability import JsonFormatter, redact, sentry_before_send
from config.otel_config import outgoing_request_hook, request_hook, response_hook


class RedactionTests(SimpleTestCase):
    def test_sensitive_values_are_redacted(self):
        value = redact({"Authorization": "Bearer secret", "pin": "1234", "qr": "person", "safe": 2})
        self.assertEqual(value, {"Authorization": "[REDACTED]", "pin": "[REDACTED]", "qr": "[REDACTED]", "safe": 2})

    def test_json_log_does_not_contain_pii(self):
        formatter = JsonFormatter()
        record = logging.LogRecord("test", logging.INFO, "", 1, "safe event", (), None)
        record.Authorization = "secret"
        output = formatter.format(record)
        self.assertNotIn("secret", output)
        self.assertNotIn("Authorization", output)

    def test_sentry_removes_request_user_and_breadcrumbs(self):
        event = sentry_before_send({"request": {"headers": {"Authorization": "x"}}, "user": {"name": "PII"}, "breadcrumbs": [1], "extra": {"pin": "1"}}, {})
        self.assertNotIn("request", event)
        self.assertNotIn("user", event)
        self.assertEqual(event["extra"]["pin"], "[REDACTED]")

    def test_otel_hooks_only_add_safe_allowlisted_attributes(self):
        span = type("Span", (), {"attributes": {}, "set_attribute": lambda self, key, value: self.attributes.update({key: value})})()
        request_hook(span, {"REQUEST_METHOD": "POST", "HTTP_AUTHORIZATION": "Bearer secret", "HTTP_COOKIE": "cookie-secret"})
        response_hook(span, None, type("Response", (), {"status_code": 200})())
        self.assertEqual(span.attributes, {"http.request.method": "POST", "http.response.status_code": 200})
        self.assertNotIn("secret", str(span.attributes))

    def test_otel_hook_overwrites_query_bearing_target(self):
        span = type("Span", (), {
            "attributes": {
                "http.target": "/feedapi/v1/volunteers/?password=hunter2",
                "http.url": "https://local/feedapi/v1/volunteers/?qr=secret-qr",
                "url.full": "https://local/feedapi/v1/volunteers/?password=hunter2",
                "url.query": "qr=secret-qr",
            },
            "set_attribute": lambda self, key, value: self.attributes.update({key: value}),
        })()
        request_hook(span, {
            "REQUEST_METHOD": "GET", "PATH_INFO": "/feedapi/v1/volunteers/",
            "QUERY_STRING": "password=hunter2&qr=secret-qr",
        })
        serialized = json.dumps(span.attributes)
        self.assertNotIn("hunter2", serialized)
        self.assertNotIn("secret-qr", serialized)
        self.assertNotIn("password", serialized)

    def test_outgoing_otel_hook_removes_query_and_never_captures_headers(self):
        span = type("Span", (), {
            "attributes": {"http.url": "https://local/sync?token=hidden", "url.query": "token=hidden"},
            "set_attribute": lambda self, key, value: self.attributes.update({key: value}),
        })()
        request = type("Request", (), {
            "url": "https://local/sync?token=hidden&password=hunter2",
            "headers": {"Authorization": "Bearer secret", "Cookie": "session=secret"},
        })()
        outgoing_request_hook(span, request)
        serialized = json.dumps(span.attributes)
        for secret in ("hidden", "hunter2", "Bearer secret", "session=secret"):
            self.assertNotIn(secret, serialized)
        for variable in (
            "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST",
            "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_RESPONSE",
            "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_CLIENT_REQUEST",
            "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_CLIENT_RESPONSE",
        ):
            self.assertEqual(os.environ[variable], "")


class HealthTests(TestCase):
    def test_live_has_no_dependency(self):
        with patch("django.db.backends.utils.CursorWrapper.execute", side_effect=RuntimeError("db down")):
            self.assertEqual(self.client.get("/health/live").status_code, 200)

    def test_ready_checks_database(self):
        with tempfile.TemporaryDirectory() as photo_directory, override_settings(PHOTO_STORAGE_PATH=photo_directory):
            response = self.client.get("/health/ready")
        self.assertEqual(response.status_code, 200, response.json())

    def test_dependencies_is_protected(self):
        self.assertEqual(self.client.get("/health/dependencies").status_code, 404)

    def test_dependencies_never_claim_unmeasured_signals_are_ok(self):
        with patch.dict("os.environ", {"HEALTH_DEPENDENCIES_TOKEN": "test-token", "DISABLE_CRON": "True"}, clear=False):
            response = self.client.get("/health/dependencies", HTTP_AUTHORIZATION="Bearer test-token")
        self.assertEqual(response.status_code, 200)
        dependencies = response.json()["dependencies"]
        self.assertEqual(dependencies["incoming_sync"]["status"], "disabled")
        self.assertEqual(dependencies["cron_heartbeat"]["status"], "disabled")
        self.assertEqual(dependencies["opentelemetry"]["status"], "disabled")
        self.assertEqual(dependencies["alert_delivery"]["status"], "disabled")
        for value in dependencies.values():
            self.assertIn(value["status"], {"ok", "degraded", "failed", "unknown", "disabled"})
            self.assertTrue(value["reason"])

    def test_request_id_is_returned_and_invalid_value_replaced(self):
        response = self.client.get("/health/live", HTTP_X_REQUEST_ID="bad value with spaces")
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response["X-Request-ID"], "bad value with spaces")

    @patch("config.health.os.access", return_value=False)
    def test_ready_fails_for_readonly_directory(self, _access):
        self.assertEqual(self.client.get("/health/ready").status_code, 503)

    @patch("config.health.shutil.disk_usage")
    def test_ready_fails_when_disk_is_full(self, disk_usage):
        disk_usage.return_value = type("Usage", (), {"free": 0})()
        self.assertEqual(self.client.get("/health/ready").status_code, 503)

    def test_metrics_requires_expected_token_and_has_no_query_secret(self):
        with patch.dict("os.environ", {"METRICS_TOKEN": "metrics-test-token"}):
            self.client.get("/health/live?password=hunter2")
            self.assertEqual(self.client.get("/metrics").status_code, 404)
            response = self.client.get("/metrics", HTTP_AUTHORIZATION="Bearer metrics-test-token")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(b"hunter2", response.content)

    def test_http_disk_cron_and_sync_lag_metrics_have_producers(self):
        from config.metrics import CRON_LAST_SUCCESS, DISK_FREE, HTTP_REQUESTS, SYNC_LAG
        from synchronization.models import SynchronizationSystemActions
        import tempfile
        import os
        before = HTTP_REQUESTS.labels("GET", "/health/live", "200")._value.get()
        self.client.get("/health/live")
        self.assertEqual(HTTP_REQUESTS.labels("GET", "/health/live", "200")._value.get(), before + 1)
        SynchronizationSystemActions.objects.create(system="notion", direction="from_system", date=timezone.now(), success=True)
        with tempfile.NamedTemporaryFile() as heartbeat, patch.dict("os.environ", {"CRON_HEARTBEAT_FILE": heartbeat.name}):
            self.client.get("/metrics")
            self.assertGreater(CRON_LAST_SUCCESS._value.get(), 0)
        self.assertGreaterEqual(DISK_FREE.labels("database")._value.get(), 0)
        self.assertGreaterEqual(SYNC_LAG.labels("from_system")._value.get(), 0)

    @patch("config.alerting.notify")
    def test_metrics_scrape_produces_disk_and_stale_sync_alerts(self, notify_mock):
        from synchronization.models import SynchronizationSystemActions
        from types import SimpleNamespace
        SynchronizationSystemActions.objects.create(system="notion", direction="from_system", date=timezone.now() - timedelta(hours=2), success=True)
        with patch("config.metrics.shutil.disk_usage", return_value=SimpleNamespace(free=1)), patch.dict("os.environ", {"DISK_ALERT_FREE_BYTES": "2", "SYNC_LAG_ALERT_SECONDS": "1"}):
            self.client.get("/metrics")
        keys = {call.kwargs["key"] for call in notify_mock.call_args_list}
        self.assertIn("disk-low", keys)
        self.assertIn("sync-lag-from_system", keys)
