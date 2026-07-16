import hashlib
import hmac
import json
import os
from datetime import timedelta

from django.core.cache import cache
from django.db import OperationalError, models, transaction
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from config.metrics import CLIENT_HEARTBEATS, CLIENT_PENDING_AGE, CLIENT_PENDING_COUNT, DIAGNOSTICS_EVENTS
from config.alerting import notify
from config.observability import redact

ALLOWED_EVENTS = {
    "app_start", "app_version", "db_open_failed", "transaction_write_failed", "online", "offline",
    "api_reachability", "sync_started", "sync_completed", "sync_failed", "camera_permission",
    "camera_start_error", "qr_decode_failure", "cache_reset", "full_database_refresh", "clock_skew",
    "unhandled_error", "error_boundary", "heartbeat",
}
ALLOWED_DETAIL_KEYS = {
    "app_version", "schema_version", "dexie_schema_version", "stage", "duration_ms", "pending_count",
    "oldest_pending_age_seconds", "category", "permission", "state", "online", "reachable",
    "secure_context", "clock_skew_seconds", "queue_size", "status_code", "cache_version",
}


class ClientDiagnosticEvent(models.Model):
    event_id = models.CharField(max_length=64, unique=True)
    installation_hash = models.CharField(max_length=64, db_index=True)
    kitchen_id = models.IntegerField(null=True)
    event_type = models.CharField(max_length=64)
    occurred_at = models.DateTimeField()
    app_version = models.CharField(max_length=64)
    state = models.CharField(max_length=16, default="ok")
    details = models.JSONField(default=dict)
    received_at = models.DateTimeField(auto_now_add=True, db_index=True)


class DiagnosticEventSerializer(serializers.Serializer):
    event_id = serializers.RegexField(r"^[A-Za-z0-9_-]{10,64}$")
    event_type = serializers.ChoiceField(choices=sorted(ALLOWED_EVENTS))
    occurred_at = serializers.DateTimeField()
    state = serializers.ChoiceField(choices=("ok", "degraded", "critical"), default="ok")
    details = serializers.DictField(required=False, default=dict)

    def validate_details(self, value):
        allowed = {key: item for key, item in value.items() if key in ALLOWED_DETAIL_KEYS}
        if any(isinstance(item, (dict, list)) for item in allowed.values()):
            raise serializers.ValidationError("nested_details_not_allowed")
        cleaned = redact(allowed)
        encoded = json.dumps(cleaned, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        if len(encoded) > 4096:
            raise serializers.ValidationError("details_too_large")
        return cleaned


class DiagnosticBatchSerializer(serializers.Serializer):
    device_id = serializers.RegexField(r"^[A-Za-z0-9_-]{16,64}$")
    app_version = serializers.CharField(max_length=64)
    events = DiagnosticEventSerializer(many=True, min_length=1, max_length=50)


class ClientDiagnosticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=DiagnosticBatchSerializer, responses={200: dict})
    def post(self, request):
        if len(request.body) > 64 * 1024:
            DIAGNOSTICS_EVENTS.labels("rejected", "payload_too_large").inc()
            return Response({"detail": "payload_too_large"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        serializer = DiagnosticBatchSerializer(data=request.data)
        if not serializer.is_valid():
            DIAGNOSTICS_EVENTS.labels("rejected", "invalid_schema").inc()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        hmac_key = os.getenv("DIAGNOSTICS_HMAC_KEY", "")
        if not hmac_key:
            DIAGNOSTICS_EVENTS.labels("rejected", "disabled").inc()
            return Response({"detail": "diagnostics_disabled"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        installation_hash = hmac.new(
            hmac_key.encode(), serializer.validated_data["device_id"].encode(), hashlib.sha256
        ).hexdigest()
        rate_key = f"diagnostics:{installation_hash}:{timezone.now():%Y%m%d%H%M}"
        cache.add(rate_key, 0, 120)
        count = cache.incr(rate_key, len(serializer.validated_data["events"]))
        if count > 100:
            DIAGNOSTICS_EVENTS.labels("rejected", "rate_limited").inc()
            notify(key="diagnostics-rejections", severity="warning", message="Diagnostics ingest rejection threshold reached")
            return Response({"detail": "rate_limited"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        kitchen_id = getattr(request.user, "id", None)
        events = serializer.validated_data["events"]
        try:
            existing = set(ClientDiagnosticEvent.objects.filter(
                event_id__in=[event["event_id"] for event in events]
            ).values_list("event_id", flat=True))
            new_events = [event for event in events if event["event_id"] not in existing]
            with transaction.atomic():
                ClientDiagnosticEvent.objects.bulk_create([
                    ClientDiagnosticEvent(
                        event_id=event["event_id"], installation_hash=installation_hash, kitchen_id=kitchen_id,
                        event_type=event["event_type"], occurred_at=event["occurred_at"],
                        app_version=serializer.validated_data["app_version"], state=event["state"],
                        details=event["details"],
                    ) for event in new_events
                ], ignore_conflicts=True)
                expired_ids = list(ClientDiagnosticEvent.objects.filter(
                    received_at__lt=timezone.now() - timedelta(days=7)
                ).values_list("id", flat=True)[:1000])
                if expired_ids:
                    ClientDiagnosticEvent.objects.filter(id__in=expired_ids).delete()
        except OperationalError:
            DIAGNOSTICS_EVENTS.labels("rejected", "sqlite_busy").inc()
            notify(key="diagnostics-rejections", severity="warning", message="Diagnostics ingest unavailable because SQLite is busy")
            return Response({"detail": "diagnostics_temporarily_unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        for event in events:
            if event["event_type"] == "heartbeat":
                CLIENT_HEARTBEATS.labels(event["state"]).inc()
                if isinstance(event["details"].get("pending_count"), (int, float)):
                    CLIENT_PENDING_COUNT.set(event["details"]["pending_count"])
                if isinstance(event["details"].get("oldest_pending_age_seconds"), (int, float)):
                    CLIENT_PENDING_AGE.set(event["details"]["oldest_pending_age_seconds"])
        created = len(new_events)
        DIAGNOSTICS_EVENTS.labels("accepted", "stored").inc(created)
        DIAGNOSTICS_EVENTS.labels("accepted", "duplicate").inc(len(events) - created)
        return Response({"accepted": created})
