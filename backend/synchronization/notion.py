import logging
from datetime import datetime
from urllib.parse import urljoin

import requests
from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import APIException

from feeder.models import Volunteer
from feeder.sync_serializers import VolunteerHistoryDataSerializer, DirectionHistoryDataSerializer
from history.models import History
from history.serializers import HistorySyncSerializer
from synchronization.models import SynchronizationSystemActions as SyncModel

logger = logging.getLogger(__name__)


class NotionSync:

    @staticmethod
    def get_last_sync_time(direction):
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

        qs = History.objects.filter(action_at__gte=dt_start, action_at__lt=dt_end)
        badges = qs.filter(object_name="volunteer")
        arrivals = qs.filter(object_name="arrival")
        serializer = HistorySyncSerializer
        data = {
            "badges": serializer(badges, many=True).data,
            "arrivals": serializer(arrivals, many=True).data
        }
        # url = urljoin(settings.AGREEMOD_PEOPLE_URL, "feeder/back-sync")
        # response = requests.post(
        #     url=url,
        #     json=data
        # )
        # if not response.ok:
        #     error = response.text
        #     self.save_sync_info(sync_data, success=False, error=error)
        #     raise APIException(f"Sync to notion field with error: {error}")

        self.save_sync_info(sync_data)

    @staticmethod
    def get_serializer(obj_name):
        serializers = {
            "badges": VolunteerHistoryDataSerializer,
            "directions": DirectionHistoryDataSerializer,
        }
        return serializers.get(obj_name)

    def save_data_from_notion(self, data_list, obj_name):
        serializer_class = self.get_serializer(obj_name)
        for data in data_list:
            serializer = serializer_class(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

    def sync_from_notion(self):
        direction = SyncModel.DIRECTION_FROM_SYSTEM
        dt = self.get_last_sync_time(direction)

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": direction,
            "date": datetime.utcnow()
        }

        url = urljoin(settings.AGREEMOD_PEOPLE_URL, "feeder/sync")
        params = {"from_date": dt.strftime("%Y-%m-%dT%H:%M:%S.%f%z")}
        response = requests.get(url, params=params)
        if not response.ok:
            error = response.text
            self.save_sync_info(sync_data, success=False, error=error)
            raise APIException(f"Sync from notion field with error: {error}")

        try:
            data = response.json()
            with transaction.atomic():
                direct = [
                    {
                        "id": "d3eb6cfc-b3a0-48dd-9999-ab871a7a8239",
                        "deleted": False,
                        "name": "maintain",
                        "first_year": 1988,
                        "last_year": 2022,
                        "type": "Федеральная локация",
                        "notion_id": "695fc30d-26d6-4ebd-87b2-78de9f7ed487"
                    },
                    {
                        "id": "574c2d2a-07b2-48ca-ab78-b22a84fe6c3a",
                        "deleted": False,
                        "name": "yeah",
                        "first_year": 2006,
                        "last_year": 2022,
                        "type": "Грантовая локация",
                        "notion_id": "ac6ab00d-f7c6-4a88-b0e3-07f397b3226f"
                    },
                    {
                        "id": "57f4502d-2b19-4211-a024-86ff761d9c45",
                        "deleted": False,
                        "name": "strategy",
                        "first_year": 1989,
                        "last_year": 1976,
                        "type": "Универсальная служба",
                        "notion_id": "8a67c9ca-a0e2-4c72-8577-d40615ab7972"
                    },
                    {
                        "id": "e9b16532-424e-45ea-9123-a83da9d48e11",
                        "deleted": False,
                        "name": "lay",
                        "first_year": 2009,
                        "last_year": 1983,
                        "type": "Полевая служба",
                        "notion_id": "a5bca83d-1630-46a2-86d6-bf8ece61a672"
                    },
                    {
                        "id": "61d079f2-7692-444b-b83a-d90295966466",
                        "deleted": False,
                        "name": "standard",
                        "first_year": 1978,
                        "last_year": 1970,
                        "type": "Федеральная локация",
                        "notion_id": "4c43b8bc-c9eb-4177-ba30-6e66b7884866"
                    }]
                self.save_data_from_notion(direct, "directions")
                # self.save_data_from_notion(data.get("directions"), "directions")
                # self.save_data_from_notion(data.get("persons"), "persons")
                # self.save_data_from_notion(data.get("engagements"), "engagements")
                # self.save_data_from_notion(data.get("badges"), "badges")
                # self.save_data_from_notion(data.get("arrivals"), "arrivals")

        except Exception as er:
            self.save_sync_info(sync_data, success=False, error=er)
            raise APIException(f"Saving data from notion failed with error: {er}")

        self.save_sync_info(sync_data)

    def main(self):
        self.sync_to_notion()
        self.sync_from_notion()
