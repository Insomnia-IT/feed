import logging
from datetime import datetime
from urllib.parse import urljoin
import json
import os

import requests
from django.conf import settings
from django.db import transaction
from requests.auth import HTTPBasicAuth
from rest_framework.exceptions import APIException

from feeder.sync_serializers import (VolunteerHistoryDataSerializer, DirectionHistoryDataSerializer,
                                     ArrivalHistoryDataSerializer, PersonHistoryDataSerializer,
                                     EngagementHistoryDataSerializer)
from history.models import History
from history.serializers import HistorySyncSerializer
from synchronization.models import SynchronizationSystemActions as SyncModel

logger = logging.getLogger(__name__)

MAX_DUMP_SIZE = 50000
BACK_SYNC_ITEMS_LIMIT = 100

class NotionSync:
    all_data = False
    error_sync = []

    def get_last_sync_time(self, direction):
        if self.all_data:
            return datetime(year=2013, month=6, day=13)
        sync = SyncModel.objects.filter(direction=direction, success=True, partial_offset=None).order_by("-date").first()
        if sync:
            return sync.date
        else:
            return datetime(year=2013, month=6, day=13)

    def get_last_sync_partial_offset(self, direction):
        sync = SyncModel.objects.filter(direction=direction, success=True).order_by("-date").first()
        if sync:
            return sync.partial_offset
        return None

    @staticmethod
    def save_sync_info(data, success=True, error=None):

        if not success or error:
            data.update({
                "success": success,
                "error": error[0:MAX_DUMP_SIZE] if len(error) > MAX_DUMP_SIZE else error
            })
        SyncModel.objects.create(**data)

    def sync_to_notion(self):
        direction = SyncModel.DIRECTION_TO_SYSTEM
        dt_start = self.get_last_sync_time(direction)
        partial_offset = self.get_last_sync_partial_offset(direction) or 0

        dt_end = datetime.utcnow()

        qs = History.objects.filter(action_at__gte=dt_start, action_at__lt=dt_end).exclude(actor_badge=None)
        badges = qs.filter(object_name="volunteer")
        arrivals = qs.filter(object_name="arrival")
        serializer = HistorySyncSerializer
        data = {}
        new_partial_offset = None
        print('badges', len(badges))
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
            return True

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": dt_end,
            "partial_offset": new_partial_offset
        }

        print('=== sync_to_notion ===')
        print(dt_start.isoformat(), dt_end.isoformat())
        dump = json.dumps(data)
        print(dump)

        url = urljoin(settings.SYNCHRONIZATION_URL, "back-sync")
        response = requests.post(
            url=url,
            auth=HTTPBasicAuth(
                settings.SYNCHRONIZATION_LOGIN,
                settings.SYNCHRONIZATION_PASSWORD
            ),
            json=data
        )
        if not response.ok:
            print(json.dumps(data, indent=4))
            error = response.text
            self.save_sync_info(sync_data, success=False, error=error)
            raise APIException(f"Sync to notion field with error: {json.dumps(data)}, {error}")

        self.save_sync_info(sync_data, success=True, error=dump)
        return new_partial_offset is None

    @staticmethod
    def get_serializer(obj_name):
        serializers = {
            "badges": VolunteerHistoryDataSerializer,
            "directions": DirectionHistoryDataSerializer,
            "persons": PersonHistoryDataSerializer,
            "arrivals": ArrivalHistoryDataSerializer,
            "engagements": EngagementHistoryDataSerializer
        }
        return serializers.get(obj_name)

    def save_data_from_notion(self, data_list, obj_name):
        serializer_class = self.get_serializer(obj_name)
        for data in data_list:
            try:
                serializer = serializer_class(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
            except Exception as error:
                self.error_sync.append(f"{obj_name} - {data.get('id')}: {error}")

    def sync_from_notion(self):    
        direction = SyncModel.DIRECTION_FROM_SYSTEM
        dt = self.get_last_sync_time(direction)

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": datetime.utcnow()
        }

        url = urljoin(settings.SYNCHRONIZATION_URL, "sync")
        params = {"from_date": dt.strftime("%Y-%m-%dT%H:%M:%S")}
        response = requests.get(
            url,
            auth=HTTPBasicAuth(
                settings.SYNCHRONIZATION_LOGIN,
                settings.SYNCHRONIZATION_PASSWORD
            ),
            params=params
        )
        if not response.ok:
            error = response.text
            self.save_sync_info(sync_data, success=False, error=error)
            raise APIException(f"Sync from notion field with error: {error}")
        
        dump = None

        try:
            data = response.json()
            print('=== sync_from_notion ===')
            print(params)
            dump = json.dumps(data)
            print(dump)
            with transaction.atomic():
                self.save_data_from_notion(data.get("persons", []), "persons")
                self.save_data_from_notion(data.get("directions", []), "directions")
                self.save_data_from_notion(data.get("engagements", []), "engagements")
                self.save_data_from_notion(data.get("badges", []), "badges")
                self.save_data_from_notion(data.get("arrivals", []), "arrivals")

                if self.error_sync:
                    raise APIException(self.error_sync)

        except Exception as er:
            self.save_sync_info(sync_data, success=False, error=er)
            raise APIException(f"Saving data from notion failed with error: {er}")

        self.save_sync_info(sync_data, success=True, error=dump)

    def main(self, all_data=False):
        self.all_data = all_data

        if not settings.SKIP_BACK_SYNC:
            if self.sync_to_notion():
                self.sync_from_notion()
        else:
            self.sync_from_notion()
