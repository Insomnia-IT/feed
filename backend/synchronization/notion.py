import logging
from datetime import datetime, timezone
from urllib.parse import urljoin
from contextlib import contextmanager
import os
import re
import time

import requests
from django.conf import settings
from django.db import transaction
from requests.auth import HTTPBasicAuth
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from rest_framework.exceptions import APIException

from feeder.sync_serializers import (VolunteerHistoryDataSerializer, DirectionHistoryDataSerializer,
                                     ArrivalHistoryDataSerializer, PaidArrivalHistoryDataSerializer,
                                     PersonHistoryDataSerializer,
                                     EngagementHistoryDataSerializer)
from history.models import History
from history.serializers import HistorySyncSerializer
from synchronization.models import SynchronizationSystemActions as SyncModel
from config.alerting import notify
from config.metrics import SYNC_ATTEMPTS, SYNC_CONSECUTIVE, SYNC_DURATION, SYNC_FAILURES, SYNC_ITEMS, SYNC_LAG, SYNC_LAST_SUCCESS, SYNC_RESULTS

logger = logging.getLogger(__name__)

MAX_DUMP_SIZE = 50000
BACK_SYNC_ITEMS_LIMIT = 100
HTTP_TIMEOUT = (5, 30)


def _metric_error_category(error):
    category = type(error).__name__ if isinstance(error, Exception) else str(error or "unknown")
    return category if re.fullmatch(r"[A-Za-z0-9_]{1,64}", category) else "sync_error"


def _lock_path():
    return os.getenv("SYNC_LOCK_FILE", "/tmp/feed-sync.lock")


def reserve_sync_dispatch(token):
    lock_path = _lock_path()
    stale_after = int(os.getenv("SYNC_LOCK_STALE_SECONDS", "900"))
    if os.path.exists(lock_path) and time.time() - os.path.getmtime(lock_path) > stale_after:
        os.unlink(lock_path)
    descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    try:
        os.write(descriptor, token.encode())
    finally:
        os.close(descriptor)


def release_sync_dispatch(token):
    lock_path = _lock_path()
    try:
        with open(lock_path, encoding="utf-8") as lock_file:
            matches = lock_file.read() == token
        if matches:
            os.unlink(lock_path)
    except FileNotFoundError:
        pass


def _session():
    session = requests.Session()
    retry = Retry(total=2, connect=2, read=2, backoff_factor=0.5, status_forcelist=(429, 502, 503, 504), allowed_methods=("GET",))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


@contextmanager
def sync_lock(reservation_token=None):
    lock_path = _lock_path()
    stale_after = int(os.getenv("SYNC_LOCK_STALE_SECONDS", "900"))
    try:
        if os.path.exists(lock_path) and time.time() - os.path.getmtime(lock_path) > stale_after:
            os.unlink(lock_path)
        if reservation_token and os.path.exists(lock_path):
            with open(lock_path, encoding="utf-8") as lock_file:
                if lock_file.read() != reservation_token:
                    raise FileExistsError(lock_path)
        else:
            descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(descriptor, str(os.getpid()).encode())
            os.close(descriptor)
    except FileExistsError as exc:
        raise APIException("sync_already_running") from exc
    try:
        yield
    finally:
        try:
            os.unlink(lock_path)
        except FileNotFoundError:
            pass


class NotionSync:
    def __init__(self, trigger="manual", reservation_token=None):
        self.all_data = False
        self.error_sync = []
        self.http = _session()
        self.trigger = trigger
        self.reservation_token = reservation_token

    def get_last_sync_time(self, direction):
        if self.all_data:
            return datetime(year=2013, month=6, day=13).replace(tzinfo=timezone.utc)
        sync = SyncModel.objects.filter(direction=direction, success=True, partial_offset=None).order_by("-date").first()
        if sync:
            return sync.date
        else:
            return datetime(year=2013, month=6, day=13).replace(tzinfo=timezone.utc)

    def get_last_sync_partial_offset(self, direction):
        sync = SyncModel.objects.filter(direction=direction, success=True).order_by("-date").first()
        if sync:
            return sync.partial_offset
        return None

    @staticmethod
    def save_sync_info(data, success=True, error=None):
        finished = datetime.now(timezone.utc)
        started = data.get("started_at") or finished
        category = None if success else _metric_error_category(error)
        previous = SyncModel.objects.filter(direction=data["direction"]).order_by("-date", "-id").first()
        failures = 0 if success else ((previous.consecutive_failure_count if previous else 0) + 1)
        data.update(finished_at=finished, duration_ms=max(0, int((finished - started).total_seconds() * 1000)),
                    error_count=0 if success else 1, error_category=category,
                    consecutive_failure_count=failures)
        if not success or error:
            data.update({
                "success": success,
                "error": type(error).__name__ if isinstance(error, Exception) else str(error)[:64]
            })
        record = SyncModel.objects.create(**data)
        direction = data["direction"]
        SYNC_ATTEMPTS.labels(direction, data.get("trigger", "manual")).inc()
        SYNC_DURATION.labels(direction).observe(data["duration_ms"] / 1000)
        SYNC_ITEMS.labels(direction, "processed").inc(data.get("processed_count", 0))
        SYNC_CONSECUTIVE.labels(direction).set(failures)
        SYNC_RESULTS.labels(direction, "success" if success else "failure").inc()
        lag = max(0, (finished - record.date).total_seconds())
        SYNC_LAG.labels(direction).set(lag)
        if success:
            SYNC_LAST_SUCCESS.labels(direction).set(finished.timestamp())
            if previous and previous.consecutive_failure_count:
                notify(key=f"sync-failure-{direction}", severity="info", message="External synchronization recovered",
                       recovered=True, sync_run_id=str(record.sync_run_id))
        else:
            SYNC_FAILURES.labels(direction, category or "unknown").inc()
            if failures >= int(os.getenv("SYNC_FAILURE_ALERT_THRESHOLD", "3")):
                notify(key=f"sync-failure-{direction}", severity="warning",
                       message="External synchronization repeatedly failed", sync_run_id=str(record.sync_run_id))
        if lag > int(os.getenv("SYNC_LAG_ALERT_SECONDS", "1800")):
            notify(key=f"sync-lag-{direction}", severity="warning", message="External synchronization is stale",
                   sync_run_id=str(record.sync_run_id))
        return record

    def sync_to_notion(self):
        direction = SyncModel.DIRECTION_TO_SYSTEM
        dt_start = self.get_last_sync_time(direction)
        partial_offset = self.get_last_sync_partial_offset(direction) or 0

        dt_end = datetime.now(timezone.utc)

        qs = History.objects.filter(action_at__gte=dt_start, action_at__lt=dt_end).exclude(actor_badge=None)
        badges = qs.filter(object_name="volunteer")
        arrivals = qs.filter(object_name="arrival")
        serializer = HistorySyncSerializer
        data = {}
        new_partial_offset = None
        if badges:
            badges_data = serializer(badges, many=True).data
            data.update({"badges": badges_data[partial_offset:partial_offset + BACK_SYNC_ITEMS_LIMIT]})
            if len(badges_data) - partial_offset > BACK_SYNC_ITEMS_LIMIT:
                new_partial_offset = partial_offset + BACK_SYNC_ITEMS_LIMIT

        if arrivals:
            arrivals_data = serializer(arrivals, many=True).data
            offset = partial_offset - len(badges)
            data.update({"arrivals": arrivals_data[max(0, offset):max(0, offset + BACK_SYNC_ITEMS_LIMIT)]})
            if len(arrivals_data) - offset > BACK_SYNC_ITEMS_LIMIT:
                new_partial_offset = partial_offset + BACK_SYNC_ITEMS_LIMIT

        if not data:
            return data

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": dt_end,
            "partial_offset": new_partial_offset, "started_at": datetime.now(timezone.utc),
            "trigger": self.trigger, "received_count": len(data.get("badges", [])) + len(data.get("arrivals", [])),
            "processed_count": len(data.get("badges", [])) + len(data.get("arrivals", [])),
        }

        url = urljoin(settings.SYNCHRONIZATION_URL, "back-sync")
        try:
            response = self.http.post(
                url=url,
                auth=HTTPBasicAuth(settings.SYNCHRONIZATION_LOGIN, settings.SYNCHRONIZATION_PASSWORD),
                json=data, timeout=HTTP_TIMEOUT,
            )
        except requests.RequestException as exc:
            self.save_sync_info(sync_data, success=False, error=type(exc).__name__)
            raise APIException("Sync to external system failed") from exc
        if not response.ok:
            self.save_sync_info(sync_data, success=False, error=f"http_{response.status_code}")
            raise APIException("Sync to external system failed")

        self.save_sync_info(sync_data, success=True)

        return data

    @staticmethod
    def get_serializer(obj_name):
        serializers = {
            "badges": VolunteerHistoryDataSerializer,
            "directions": DirectionHistoryDataSerializer,
            "persons": PersonHistoryDataSerializer,
            "arrivals": ArrivalHistoryDataSerializer,
            "paid_arrivals": PaidArrivalHistoryDataSerializer,
            "engagements": EngagementHistoryDataSerializer
        }
        return serializers.get(obj_name)

    @staticmethod
    def is_missing_volunteer_error(error):
        return "Volunteer not found" in str(error)

    @staticmethod
    def save_data_item(serializer_class, data):
        try:
            serializer = serializer_class(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        except Exception as error:
            return error

        return None

    def save_data_from_notion(self, data_list, obj_name):
        serializer_class = self.get_serializer(obj_name)
        delayed_badges = []

        for data in data_list:
            error = self.save_data_item(serializer_class, data)
            if not error:
                continue

            if obj_name == "badges" and self.is_missing_volunteer_error(error):
                delayed_badges.append(data)
                continue

            self.error_sync.append(type(error).__name__)

        for data in delayed_badges:
            error = self.save_data_item(serializer_class, data)
            if error:
                self.error_sync.append(type(error).__name__)

    def sync_from_notion(self, skip_badges=None, skip_arrivals=None):
        skip_badges = skip_badges or []
        skip_arrivals = skip_arrivals or []
        direction = SyncModel.DIRECTION_FROM_SYSTEM
        dt = self.get_last_sync_time(direction)

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": datetime.now(timezone.utc), "started_at": datetime.now(timezone.utc), "trigger": self.trigger,
        }

        url = urljoin(settings.SYNCHRONIZATION_URL, "sync")
        params = {"from_date": dt.strftime("%Y-%m-%dT%H:%M:%S")}
        try:
            response = self.http.get(
                url, auth=HTTPBasicAuth(settings.SYNCHRONIZATION_LOGIN, settings.SYNCHRONIZATION_PASSWORD),
                params=params, timeout=HTTP_TIMEOUT,
            )
        except requests.RequestException as exc:
            self.save_sync_info(sync_data, success=False, error=type(exc).__name__)
            raise APIException("Sync from external system failed") from exc
        if not response.ok:
            self.save_sync_info(sync_data, success=False, error=f"http_{response.status_code}")
            raise APIException("Sync from external system failed")

        skip_badge_by_id = {}
        for badge in skip_badges:
            skip_badge_by_id[badge['data']['id']] = True

        skip_arrival_by_id = {}
        for arrival in skip_arrivals:
            skip_arrival_by_id[arrival['data']['id']] = True

        try:
            data = response.json()
            if not isinstance(data, dict):
                raise ValueError("malformed_response")
            item_count = sum(len(data.get(key, [])) for key in ("persons", "directions", "engagements", "badges", "arrivals", "paid_arrivals"))
            sync_data.update(received_count=item_count, processed_count=item_count)
            with transaction.atomic():
                self.save_data_from_notion(data.get("persons", []), "persons")
                self.save_data_from_notion(data.get("directions", []), "directions")
                self.save_data_from_notion(data.get("engagements", []), "engagements")
                self.save_data_from_notion(filter(lambda b: not skip_badge_by_id.get(b['id']), data.get("badges", [])), "badges")
                self.save_data_from_notion(filter(lambda a: not skip_arrival_by_id.get(a['id']), data.get("arrivals", [])), "arrivals")
                self.save_data_from_notion(data.get("paid_arrivals", []), "paid_arrivals")

                if self.error_sync:
                    raise APIException(self.error_sync)

        except Exception as er:
            self.save_sync_info(sync_data, success=False, error=er)
            raise APIException("Saving data from external system failed")

        self.save_sync_info(sync_data, success=True)

    def main(self, all_data=False):
        with sync_lock(self.reservation_token):
            self.all_data = all_data
            if not settings.SKIP_BACK_SYNC:
                sync_data = self.sync_to_notion()
                self.sync_from_notion(sync_data.get('badges', []), sync_data.get('arrivals', []))
            else:
                self.sync_from_notion()
