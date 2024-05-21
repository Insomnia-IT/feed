import logging
from datetime import datetime

import requests
from django.conf import settings
from rest_framework.exceptions import APIException

from feeder.models import Volunteer
from history.models import History
from history.serializers import HistorySyncSerializer
from synchronization.models import SynchronizationSystemActions as SyncModel

logger = logging.getLogger(__name__)


class NotionSync:

    header = {"Authorization": settings.NOTION_AUTH_HEADER}

    def get_request_method(self, url, params=None):
        response = requests.get(
            url=url,
            params=params,
            headers=self.header
        )
        if response.ok:
            return response.json()
        raise APIException(f'GET request for url "{url}" failed with error {response.text}')

    def post_request_method(self, url, data, params=None):
        response = requests.post(
            url=url,
            json=data,
            params=params,
            headers=self.header
        )
        if response.ok:
            return True
        raise APIException(f'POST request for url "{url}" failed with error {response.text}')

    def saved_badges(self, badges):
        delete_badges_ids = []
        create_or_update_badges = []
        for badge in badges:
            if badge.get("deleted", False):
                delete_badges_ids.append(badge.get("id"))
                continue
            create_or_update_badges.append(Volunteer(**badge))
            Volunteer.objects.filter(id__in=delete_badges_ids).delete()
            # todo пеедавать признак что из синхронизации???
            Volunteer.objects.bulk_create(create_or_update_badges, update_conflicts=True, unique_fields=['uuid'])

    def sync_from_notion(self):
        params = {"from_date": "2024-05-07T11:00:00.000Z"}
        try:
            data = self.get_request_method(
                url=settings.AGREEMOD_PEOPLE_URL,
                params=params
            )
        except Exception as e:
            logger.error(e)
            raise APIException()

    @staticmethod
    def sync_to_notion():
        sync = SyncModel.objects.filter(direction=SyncModel.DIRECTION_TO_SYSTEM, success=True).order_by("date")
        if sync:
            dt_start = sync[-1].date
        else:
            dt_start = datetime(year=2013, month=6, day=13)
        dt_end = datetime.utcnow()

        sync_data = {
            "system": SyncModel.SYSTEM_NOTION,
            "direction": SyncModel.DIRECTION_TO_SYSTEM,
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
        url = settings.AGREEMOD_PEOPLE_URL
        response = requests.post(
            url=url,
            json=data
        )
        if not response.ok:
            error = response.text
            sync_data.update({
                "success": False,
                "error": error
            })
            SyncModel.objects.create(**sync_data)
            raise APIException(f"Sync to notion field with error: {error}")

        SyncModel.objects.create(**sync_data)

    def main(self):
        self.sync_to_notion()
        self.sync_from_notion()
