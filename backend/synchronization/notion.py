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

class NotionSync:
    all_data = False
    error_sync = []

    def get_last_sync_time(self, direction):
        if self.all_data:
            return datetime(year=2013, month=6, day=13)
        sync = SyncModel.objects.filter(direction=direction, success=True).order_by("-date").first()
        if sync:
            return sync.date
        else:
            return datetime(year=2013, month=6, day=13)

    @staticmethod
    def save_sync_info(data, success=True, error=None):
        if not success:
            data.update({
                "success": False,
                "error": error
            })
        SyncModel.objects.create(**data)

    def sync_to_notion(self):
        direction = SyncModel.DIRECTION_TO_SYSTEM
        dt_start = self.get_last_sync_time(direction)

        dt_end = datetime.utcnow()

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": dt_end
        }

        qs = History.objects.filter(action_at__gte=dt_start, action_at__lt=dt_end).exclude(actor_badge=None)
        badges = qs.filter(object_name="volunteer")
        arrivals = qs.filter(object_name="arrival")
        serializer = HistorySyncSerializer
        data = {}
        if badges:
            data.update({"badges": serializer(badges, many=True).data})
        if arrivals:
            data.update({"arrivals": serializer(arrivals, many=True).data})

        if not data:
            return

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

        self.save_sync_info(sync_data)

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

        try:
            data = response.json()
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

        self.save_sync_info(sync_data)

    def main(self, all_data=False):
        self.all_data = all_data

        if not settings.SKIP_BACK_SYNC:
            self.sync_to_notion()

        self.sync_from_notion()
