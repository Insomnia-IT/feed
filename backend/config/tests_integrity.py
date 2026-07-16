import json
import logging
import queue
import sys
from datetime import timedelta
from io import StringIO
from unittest.mock import MagicMock, patch

from django.test import TestCase, TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from config.alerting import _deliver, _last_sent, _queue, notify
from config.observability import JsonFormatter, redact
from feeder.client_diagnostics import ClientDiagnosticEvent
from feeder.models import FeedTransaction, Kitchen
from synchronization.models import SynchronizationSystemActions
from synchronization.views import SyncWithNotion
from synchronization.notion import NotionSync, sync_lock
from synchronization.notion import release_sync_dispatch, reserve_sync_dispatch
from rest_framework.exceptions import APIException
import requests
import tempfile
import os
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def transaction_payload(ulid, kitchen, when=None, volunteer=None):
    return {
        "ulid": ulid, "volunteer": volunteer, "amount": 1,
        "dtime": (when or timezone.now()).isoformat(), "meal_time": "lunch",
        "is_vegan": False, "is_paid": False, "is_anomaly": False,
        "kitchen": kitchen.id,
    }


class TransactionSyncTests(TestCase):
    def setUp(self):
        self.kitchen_a = Kitchen.objects.create(name="Synthetic A", pin_code="test-pin-a")
        self.kitchen_b = Kitchen.objects.create(name="Synthetic B", pin_code="test-pin-b")
        self.client_a = APIClient()
        self.client_a.credentials(HTTP_AUTHORIZATION="K-PIN-CODE test-pin-a")
        self.client_b = APIClient()
        self.client_b.credentials(HTTP_AUTHORIZATION="K-PIN-CODE test-pin-b")

    def sync(self, client, kitchen, transactions, cursor=None):
        return client.post("/feedapi/v1/feed-transaction/sync", {
            "last_updated": cursor, "transactions": transactions, "kitchen_id": kitchen.id
        }, format="json")

    def test_repeated_ulid_is_idempotent(self):
        payload = transaction_payload("01IDEMPOTENT0000000000000001", self.kitchen_a)
        self.assertEqual(self.sync(self.client_a, self.kitchen_a, [payload]).status_code, 200)
        changed = {**payload, "amount": 99}
        self.assertEqual(self.sync(self.client_a, self.kitchen_a, [changed]).status_code, 200)
        self.assertEqual(FeedTransaction.objects.filter(ulid=payload["ulid"]).count(), 1)
        self.assertEqual(FeedTransaction.objects.get(ulid=payload["ulid"]).amount, 1)

    def test_two_devices_same_kitchen_and_equal_timestamps_do_not_lose_items(self):
        when = timezone.now()
        payloads = [transaction_payload(f"01SAMESTAMP{i:018d}", self.kitchen_a, when) for i in range(2)]
        for payload in payloads:
            self.assertEqual(self.sync(self.client_a, self.kitchen_a, [payload]).status_code, 200)
        self.assertEqual(set(FeedTransaction.objects.values_list("ulid", flat=True)), {p["ulid"] for p in payloads})

    def test_clock_skew_does_not_change_server_cursor_or_deduplication(self):
        for minutes, suffix in ((30, "FUTURE"), (-30, "PAST")):
            payload = transaction_payload(f"01CLOCK{suffix:0<20}", self.kitchen_a, timezone.now() + timedelta(minutes=minutes))
            response = self.sync(self.client_a, self.kitchen_a, [payload])
            self.assertEqual(response.status_code, 200)
        self.assertEqual(FeedTransaction.objects.count(), 2)

    def test_kitchens_cannot_send_or_read_each_others_transactions(self):
        foreign = transaction_payload("01FOREIGN0000000000000000001", self.kitchen_b)
        self.assertEqual(self.sync(self.client_a, self.kitchen_b, [foreign]).status_code, 400)
        self.assertEqual(self.sync(self.client_b, self.kitchen_b, [foreign]).status_code, 200)
        response = self.sync(self.client_a, self.kitchen_a, [])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["transactions"], [])

    def test_inner_kitchen_cannot_bypass_authenticated_kitchen_scope(self):
        foreign = transaction_payload("01INNERFOREIGN000000000000001", self.kitchen_b)
        response = self.sync(self.client_a, self.kitchen_a, [foreign])
        self.assertEqual(response.status_code, 400)
        self.assertFalse(FeedTransaction.objects.exists())

    def test_existing_ulid_cannot_be_moved_to_another_kitchen(self):
        payload = transaction_payload("01CROSSKITCHENULID00000000001", self.kitchen_a)
        self.assertEqual(self.sync(self.client_a, self.kitchen_a, [payload]).status_code, 200)
        foreign = {**payload, "kitchen": self.kitchen_b.id}
        self.assertEqual(self.sync(self.client_b, self.kitchen_b, [foreign]).status_code, 400)
        self.assertEqual(FeedTransaction.objects.get(ulid=payload["ulid"]).kitchen_id, self.kitchen_a.id)

    def test_invalid_partial_batch_is_fully_rejected_without_cursor_progress(self):
        valid = transaction_payload("01VALID0000000000000000000001", self.kitchen_a)
        invalid = transaction_payload("01INVALID0000000000000000001", self.kitchen_a, volunteer=999999)
        response = self.sync(self.client_a, self.kitchen_a, [valid, invalid])
        self.assertEqual(response.status_code, 400)
        self.assertFalse(FeedTransaction.objects.exists())

    def test_lost_response_retry_has_no_duplicate(self):
        payload = transaction_payload("01LOSTRESPONSE00000000000001", self.kitchen_a)
        self.sync(self.client_a, self.kitchen_a, [payload])  # response intentionally ignored
        retry = self.sync(self.client_a, self.kitchen_a, [payload])
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(FeedTransaction.objects.filter(ulid=payload["ulid"]).count(), 1)


class ExternalSyncDispatchTests(TestCase):
    @patch("synchronization.views.subprocess.Popen")
    def test_web_request_dispatches_management_command_without_running_sync_inline(self, popen):
        user = get_user_model().objects.create_user("sync-admin", password="synthetic", is_staff=True)
        client = APIClient()
        client.force_authenticate(user=user)
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"SYNC_LOCK_FILE": os.path.join(directory, "sync.lock")}):
            response = client.post("/feedapi/v1/notion-sync")
        self.assertEqual(response.status_code, 202)
        popen.assert_called_once()
        command = popen.call_args.args[0]
        self.assertEqual(command[:3], [sys.executable, "manage.py", "run_external_sync"])
        self.assertIn("--reservation-token", command)

    @patch("synchronization.views.subprocess.Popen")
    def test_second_post_is_controlled_and_completion_allows_next(self, popen):
        user = get_user_model().objects.create_user("sync-repeat", password="synthetic", is_staff=True)
        client = APIClient(); client.force_authenticate(user=user)
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"SYNC_LOCK_FILE": os.path.join(directory, "sync.lock")}):
            first = client.post("/feedapi/v1/notion-sync")
            second = client.post("/feedapi/v1/notion-sync")
            self.assertEqual((first.json()["status"], second.json()["status"]), ("started", "already_running"))
            token = popen.call_args.args[0][4]
            release_sync_dispatch(token)
            self.assertEqual(client.post("/feedapi/v1/notion-sync").json()["status"], "started")

    @patch("synchronization.views.subprocess.Popen", side_effect=OSError("synthetic"))
    def test_launch_failure_releases_reservation(self, popen):
        user = get_user_model().objects.create_user("sync-launch", password="synthetic", is_staff=True)
        client = APIClient(); client.force_authenticate(user=user)
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"SYNC_LOCK_FILE": os.path.join(directory, "sync.lock")}):
            self.assertEqual(client.post("/feedapi/v1/notion-sync").status_code, 503)
            self.assertFalse(os.path.exists(os.environ["SYNC_LOCK_FILE"]))

    def test_active_and_stale_lock_behavior(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"SYNC_LOCK_FILE": os.path.join(directory, "sync.lock"), "SYNC_LOCK_STALE_SECONDS": "1"}):
            reserve_sync_dispatch("active")
            with self.assertRaises(FileExistsError): reserve_sync_dispatch("second")
            os.utime(os.environ["SYNC_LOCK_FILE"], (time.time() - 5, time.time() - 5))
            reserve_sync_dispatch("replacement")
            release_sync_dispatch("replacement")

    @patch("synchronization.views.subprocess.Popen")
    def test_two_parallel_posts_start_only_one_process(self, popen):
        user = get_user_model().objects.create_user("sync-parallel", password="synthetic", is_staff=True)
        barrier = Barrier(2)
        def send():
            client = APIClient(); client.force_authenticate(user=user)
            barrier.wait(timeout=5)
            return client.post("/feedapi/v1/notion-sync").json()["status"]
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"SYNC_LOCK_FILE": os.path.join(directory, "sync.lock")}):
            with ThreadPoolExecutor(max_workers=2) as executor:
                statuses = list(executor.map(lambda _: send(), range(2)))
        self.assertEqual(sorted(statuses), ["already_running", "started"])
        popen.assert_called_once()


class ConcurrentTransactionSyncTests(TransactionTestCase):
    reset_sequences = True

    def test_parallel_requests_preserve_both_ulids(self):
        kitchen = Kitchen.objects.create(name="Concurrent", pin_code="concurrent-pin")
        barrier = Barrier(2)

        def send(index):
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION="K-PIN-CODE concurrent-pin")
            payload = transaction_payload(f"01CONCURRENT{index:016d}", kitchen)
            barrier.wait(timeout=5)
            return client.post("/feedapi/v1/feed-transaction/sync", {
                "last_updated": None, "transactions": [payload], "kitchen_id": kitchen.id
            }, format="json").status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = list(executor.map(send, range(2)))
        self.assertEqual(statuses, [200, 200])
        self.assertEqual(FeedTransaction.objects.filter(kitchen=kitchen).count(), 2)

    def test_diagnostics_batch_does_not_break_concurrent_feeding_write(self):
        kitchen = Kitchen.objects.create(name="Diagnostics concurrent", pin_code="diagnostics-concurrent-pin")
        barrier = Barrier(2)

        def send_transaction():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION="K-PIN-CODE diagnostics-concurrent-pin")
            payload = transaction_payload("01CONCURRENTDIAGNOSTICSFEED01", kitchen)
            barrier.wait(timeout=5)
            return client.post("/feedapi/v1/feed-transaction/sync", {
                "last_updated": None, "transactions": [payload], "kitchen_id": kitchen.id
            }, format="json").status_code

        def send_diagnostics():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION="K-PIN-CODE diagnostics-concurrent-pin")
            barrier.wait(timeout=5)
            with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": "concurrent-test-key"}):
                return client.post("/feedapi/v1/client-diagnostics", {
                    "device_id": "concurrent_device_00000001", "app_version": "test",
                    "events": [{
                        "event_id": f"01CONCURRENTDIAG{i:012d}", "event_type": "heartbeat",
                        "occurred_at": timezone.now().isoformat(), "state": "ok", "details": {"pending_count": 1}
                    } for i in range(50)]
                }, format="json").status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            feeding = executor.submit(send_transaction)
            diagnostics = executor.submit(send_diagnostics)
            statuses = (feeding.result(), diagnostics.result())
        self.assertEqual(statuses[0], 200)
        self.assertIn(statuses[1], (200, 503))
        self.assertTrue(FeedTransaction.objects.filter(ulid="01CONCURRENTDIAGNOSTICSFEED01").exists())


@override_settings(ROOT_URLCONF="config.urls")
class DiagnosticsIngestTests(TestCase):
    def setUp(self):
        self.kitchen = Kitchen.objects.create(name="Synthetic", pin_code="diagnostic-pin")
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION="K-PIN-CODE diagnostic-pin")

    def payload(self, device="device_identifier_00000001", count=1):
        return {
            "device_id": device, "app_version": "test",
            "events": [{
                "event_id": f"01EVENT{i:020d}", "event_type": "heartbeat",
                "occurred_at": timezone.now().isoformat(), "state": "ok", "details": {"safe": True}
            } for i in range(count)]
        }

    @override_settings()
    def test_disabled_without_hmac_key(self):
        with patch.dict("os.environ", {}, clear=True):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", self.payload(), content_type="application/json").status_code, 503)

    def test_hmac_pseudonymization_two_devices_and_deduplication(self):
        first_payload = None
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": "synthetic-test-key"}):
            for index, device in enumerate(("device_identifier_00000001", "device_identifier_00000002")):
                payload = self.payload(device)
                payload["events"][0]["event_id"] = f"01DEVICE{index:020d}"
                if index == 0:
                    first_payload = payload
                self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, content_type="application/json").status_code, 200)
            self.client.post("/feedapi/v1/client-diagnostics", first_payload, content_type="application/json")
        self.assertEqual(ClientDiagnosticEvent.objects.count(), 2)
        self.assertNotIn("device_identifier", json.dumps(list(ClientDiagnosticEvent.objects.values()), default=str))

    def test_diagnostics_metrics_and_pending_values_change(self):
        from config.metrics import CLIENT_HEARTBEATS, CLIENT_PENDING_AGE, CLIENT_PENDING_COUNT, DIAGNOSTICS_EVENTS
        payload = self.payload()
        payload["events"][0]["details"] = {"pending_count": 12, "oldest_pending_age_seconds": 34}
        before = DIAGNOSTICS_EVENTS.labels("accepted", "stored")._value.get()
        before_heartbeat = CLIENT_HEARTBEATS.labels("ok")._value.get()
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": "synthetic-test-key"}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, format="json").status_code, 200)
        self.assertEqual(DIAGNOSTICS_EVENTS.labels("accepted", "stored")._value.get(), before + 1)
        self.assertEqual(CLIENT_HEARTBEATS.labels("ok")._value.get(), before_heartbeat + 1)
        self.assertEqual(CLIENT_PENDING_COUNT._value.get(), 12)
        self.assertEqual(CLIENT_PENDING_AGE._value.get(), 34)

    def test_oversized_and_malformed_batches_are_rejected(self):
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": "synthetic-test-key"}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", self.payload(count=51), content_type="application/json").status_code, 400)
            malformed = self.payload()
            malformed["events"][0]["event_type"] = "not_allowed"
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", malformed, content_type="application/json").status_code, 400)
            oversized = self.payload()
            oversized["events"][0]["details"] = {"category": "x" * 5000}
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", oversized, format="json").status_code, 400)
            oversized_body = {**self.payload(), "ignored": "x" * (64 * 1024)}
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", oversized_body, format="json").status_code, 413)

    def test_rate_limit_and_kitchen_change(self):
        from django.core.cache import cache
        import hashlib
        import hmac
        payload = self.payload()
        key = "synthetic-test-key"
        installation_hash = hmac.new(key.encode(), payload["device_id"].encode(), hashlib.sha256).hexdigest()
        cache.set(f"diagnostics:{installation_hash}:{timezone.now():%Y%m%d%H%M}", 100, 120)
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": key}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, content_type="application/json").status_code, 429)
            cache.clear()
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, content_type="application/json").status_code, 200)
            other = Kitchen.objects.create(name="Other", pin_code="other-diagnostic-pin")
            other_client = APIClient()
            other_client.credentials(HTTP_AUTHORIZATION="K-PIN-CODE other-diagnostic-pin")
            payload["events"][0]["event_id"] = "01KITCHENCHANGE000000000001"
            self.assertEqual(other_client.post("/feedapi/v1/client-diagnostics", payload, format="json").status_code, 200)
        self.assertEqual(set(ClientDiagnosticEvent.objects.values_list("kitchen_id", flat=True)), {self.kitchen.id, other.id})

    def test_rate_limit_accounts_for_whole_batch(self):
        from django.core.cache import cache
        import hashlib
        import hmac
        payload = self.payload(count=11)
        key = "synthetic-test-key"
        installation_hash = hmac.new(key.encode(), payload["device_id"].encode(), hashlib.sha256).hexdigest()
        cache.set(f"diagnostics:{installation_hash}:{timezone.now():%Y%m%d%H%M}", 90, 120)
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": key}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, format="json").status_code, 429)
        self.assertEqual(ClientDiagnosticEvent.objects.count(), 0)

    @patch("feeder.client_diagnostics.notify")
    def test_rate_limit_produces_nonblocking_anomaly_alert(self, notify_mock):
        from django.core.cache import cache
        import hashlib
        import hmac
        payload = self.payload(); key = "synthetic-test-key"
        installation_hash = hmac.new(key.encode(), payload["device_id"].encode(), hashlib.sha256).hexdigest()
        cache.set(f"diagnostics:{installation_hash}:{timezone.now():%Y%m%d%H%M}", 100, 120)
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": key}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, format="json").status_code, 429)
        notify_mock.assert_called_once_with(key="diagnostics-rejections", severity="warning", message="Diagnostics ingest rejection threshold reached")

    def test_secret_values_are_not_persisted(self):
        payload = self.payload()
        payload["events"][0]["details"] = {"category": ["Bearer super-secret", {"email": "person@example.test"}]}
        with patch.dict("os.environ", {"DIAGNOSTICS_HMAC_KEY": "synthetic-test-key"}):
            self.assertEqual(self.client.post("/feedapi/v1/client-diagnostics", payload, content_type="application/json").status_code, 400)
        self.assertFalse(ClientDiagnosticEvent.objects.exists())


class ChannelRedactionTests(TestCase):
    SECRETS = ("secret-bearer", "hunter2", "1234", "qr-value", "person@example.test", "+7 999 123 45 67")

    def test_nested_and_embedded_strings_are_redacted(self):
        value = redact({"safe": [
            "Bearer secret-bearer", "password=hunter2", "K-PIN-CODE 1234",
            "qr=qr-value", "person@example.test", "+7 999 123 45 67"
        ], "name": "Synthetic Person", "axios_error": {"config": {"headers": {"Authorization": "Bearer secret-bearer"}}}})
        serialized = json.dumps(value)
        for secret in self.SECRETS:
            self.assertNotIn(secret, serialized)
        self.assertNotIn("Synthetic Person", serialized)

    def test_json_log_traceback_does_not_emit_embedded_secrets(self):
        formatter = JsonFormatter()
        try:
            raise RuntimeError("Authorization: Bearer secret-bearer password=hunter2")
        except RuntimeError:
            record = logging.LogRecord("test", logging.ERROR, "", 1, "failed password=hunter2", (), sys.exc_info())
        output = formatter.format(record)
        self.assertNotIn("hunter2", output)
        self.assertNotIn("secret-bearer", output)

    def test_matrix_payload_is_redacted_and_nonblocking_when_queue_full(self):
        _last_sent.clear()
        captured = []
        with patch.object(_queue, "put_nowait", side_effect=captured.append):
            self.assertTrue(notify(key="test", severity="warning", message="Bearer secret-bearer", request_id="safe"))
        payload = captured[0]
        self.assertNotIn("secret-bearer", json.dumps(payload))
        with patch.object(_queue, "put_nowait", side_effect=queue.Full):
            self.assertFalse(notify(key="overflow", severity="warning", message="safe"))

    def test_matrix_timeout_and_500_are_best_effort(self):
        with patch.dict("os.environ", {"MATRIX_WEBHOOK_URL": "http://127.0.0.1.invalid/matrix"}):
            with patch("config.alerting.requests.post", side_effect=requests.Timeout):
                self.assertFalse(_deliver({"message": "safe"}))
            response = MagicMock()
            response.raise_for_status.side_effect = requests.HTTPError("500")
            with patch("config.alerting.requests.post", return_value=response):
                self.assertFalse(_deliver({"message": "safe"}))

    def test_alert_deduplication_cooldown_and_recovery(self):
        _last_sent.clear()
        captured = []
        with patch.object(_queue, "put_nowait", side_effect=captured.append):
            self.assertTrue(notify(key="same", severity="warning", message="safe"))
            self.assertFalse(notify(key="same", severity="warning", message="safe"))
            self.assertTrue(notify(key="same", severity="info", message="recovered", recovered=True))
        self.assertEqual(len(captured), 2)
        self.assertTrue(captured[-1]["recovered"])


class ExternalSyncFailureTests(TestCase):
    @patch("synchronization.management.commands.run_external_sync.NotionSync.main")
    def test_successful_cron_command_updates_heartbeat(self, sync_main):
        from django.core.management import call_command
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"CRON_HEARTBEAT_FILE": os.path.join(directory, "heartbeat")}):
            call_command("run_external_sync", trigger="cron")
            self.assertTrue(os.path.exists(os.environ["CRON_HEARTBEAT_FILE"]))

    @patch("synchronization.notion.notify")
    def test_sync_metrics_failures_recovery_and_alerts_have_real_producer(self, notify_mock):
        from config.metrics import SYNC_ATTEMPTS, SYNC_CONSECUTIVE, SYNC_DURATION, SYNC_FAILURES, SYNC_ITEMS, SYNC_LAST_SUCCESS, SYNC_RESULTS
        direction = SynchronizationSystemActions.DIRECTION_FROM_SYSTEM
        before_attempts = SYNC_ATTEMPTS.labels(direction, "cron")._value.get()
        before_failures = SYNC_FAILURES.labels(direction, "Timeout")._value.get()
        before_results = SYNC_RESULTS.labels(direction, "failure")._value.get()
        for _ in range(3):
            NotionSync.save_sync_info({"system": "notion", "direction": direction, "date": timezone.now(), "started_at": timezone.now(), "trigger": "cron"}, False, "Timeout")
        self.assertEqual(SYNC_ATTEMPTS.labels(direction, "cron")._value.get(), before_attempts + 3)
        self.assertEqual(SYNC_FAILURES.labels(direction, "Timeout")._value.get(), before_failures + 3)
        self.assertEqual(SYNC_RESULTS.labels(direction, "failure")._value.get(), before_results + 3)
        self.assertEqual(SYNC_CONSECUTIVE.labels(direction)._value.get(), 3)
        self.assertTrue(any(call.kwargs.get("severity") == "warning" for call in notify_mock.call_args_list))
        NotionSync.save_sync_info({"system": "notion", "direction": direction, "date": timezone.now(), "started_at": timezone.now(), "trigger": "cron", "processed_count": 2}, True)
        self.assertEqual(SYNC_CONSECUTIVE.labels(direction)._value.get(), 0)
        self.assertGreater(SYNC_LAST_SUCCESS.labels(direction)._value.get(), 0)
        self.assertGreaterEqual(SYNC_DURATION.labels(direction)._sum.get(), 0)
        self.assertGreaterEqual(SYNC_ITEMS.labels(direction, "processed")._value.get(), 2)
        self.assertTrue(any(call.kwargs.get("recovered") for call in notify_mock.call_args_list))

    @patch("config.alerting.notify")
    def test_repeated_sqlite_busy_updates_metric_and_alerts(self, notify_mock):
        from config.metrics import SQLITE_BUSY, _sqlite_busy_times, record_sqlite_busy
        _sqlite_busy_times.clear()
        before = SQLITE_BUSY._value.get()
        with patch.dict("os.environ", {"SQLITE_BUSY_ALERT_THRESHOLD": "3"}):
            for _ in range(3): record_sqlite_busy()
        self.assertEqual(SQLITE_BUSY._value.get(), before + 3)
        notify_mock.assert_called_once()
    def test_timeout_and_http_500_record_only_safe_error_category(self):
        sync = NotionSync()
        sync.http.get = MagicMock(side_effect=requests.Timeout("Bearer must-not-persist"))
        with self.assertRaises(APIException):
            sync.sync_from_notion()
        stored = SynchronizationSystemActions.objects.get()
        self.assertFalse(stored.success)
        self.assertEqual(stored.error, "Timeout")
        self.assertNotIn("must-not-persist", stored.error)

        SynchronizationSystemActions.objects.all().delete()
        response = MagicMock(ok=False, status_code=500)
        sync.http.get = MagicMock(return_value=response)
        with self.assertRaises(APIException):
            sync.sync_from_notion()
        self.assertEqual(SynchronizationSystemActions.objects.get().error, "http_500")

    def test_malformed_response_is_failed_and_redacted(self):
        sync = NotionSync()
        response = MagicMock(ok=True)
        response.json.return_value = ["password=hunter2"]
        sync.http.get = MagicMock(return_value=response)
        with self.assertRaises(APIException):
            sync.sync_from_notion()
        stored = SynchronizationSystemActions.objects.get()
        self.assertFalse(stored.success)
        self.assertEqual(stored.error, "ValueError")

    def test_second_parallel_sync_lock_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            lock_path = os.path.join(directory, "sync.lock")
            with patch.dict("os.environ", {"SYNC_LOCK_FILE": lock_path}):
                with sync_lock():
                    with self.assertRaises(APIException):
                        with sync_lock():
                            pass

    def test_dns_connection_tls_slow_and_hanging_failures_are_categorized(self):
        failures = (
            requests.ConnectionError("dns failure Bearer hidden"),
            requests.ConnectionError("connection refused password=hidden"),
            requests.exceptions.SSLError("tls failure token=hidden"),
            requests.ReadTimeout("slow response qr=hidden"),
            requests.Timeout("hanging response cookie=hidden"),
        )
        for failure in failures:
            with self.subTest(category=type(failure).__name__):
                SynchronizationSystemActions.objects.all().delete()
                sync = NotionSync()
                sync.http.get = MagicMock(side_effect=failure)
                with self.assertRaises(APIException):
                    sync.sync_from_notion()
                stored = SynchronizationSystemActions.objects.get()
                self.assertEqual(stored.error, type(failure).__name__)
                self.assertNotIn("hidden", stored.error)
