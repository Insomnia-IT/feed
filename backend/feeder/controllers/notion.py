import requests

from django.conf import settings
from rest_framework.exceptions import APIException


_headers = {"Authorization": settings.NOTION_AUTH_HEADER}

class NotionAPIController:
  @staticmethod
  def get_people():
      # get all people
      response = requests.get(
          settings.AGREEMOD_PEOPLE_URL,
          headers=_headers
      )
      if not response.ok:
          raise APIException("GET agreemod/people failed")
      
      # convert succefull response to object
      return response.json()

  @staticmethod
  def post_person_arrived(parameters, data):
      # get uuid from parameters
      uuid = parameters.uuid

      # post to notion API to mark person being arrived
      response = requests.post(
          url=str(settings.AGREEMOD_ARRIVED_PERSON_URL).format(person_guid=uuid),
          headers=_headers,
          json=data
      )

      # raise error if post request has failed with error
      if not response.ok:
          raise APIException('POST agreemod/actions/person/{person_guid}/arrived failed'.format(person_guid=uuid))
      
  @staticmethod
  def post_bulk_person_arrived(data):
      # post to notion API to mark person being arrived
      response = requests.post(
          url=settings.AGREEMOD_ARRIVED_BULK_URL,
          headers=_headers,
          json=data
      )

      # raise error if post request has failed with error
      if not response.ok:
          raise APIException('POST agreemod/actions/bulk/person/arrived failed')
      
      # convert succefull response to object
      return response.json()