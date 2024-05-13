import logging

import requests
from django.conf import settings
from rest_framework.exceptions import APIException

from feeder.models import Volunteer

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

    def sync_to_notion(self):
        pass

    def main(self):
        self.sync_to_notion()
        self.sync_from_notion()
