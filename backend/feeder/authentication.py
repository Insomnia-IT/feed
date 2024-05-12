from django.contrib.auth.models import AnonymousUser
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication as BaseTokenAuthentication

from feeder import models

from feeder.models import Volunteer


class KitchenPinAuthentication(BaseTokenAuthentication):
    keyword = 'K-PIN-CODE'

    def authenticate_credentials(self, key):

        try:
            kitchen = models.Kitchen.objects.get(pin_code=key)

            user = KitchenUser()
            user.id = kitchen.id
            user.first_name = kitchen.name

        except models.Kitchen.DoesNotExist:
            raise exceptions.AuthenticationFailed(_("Invalid token."))

        return user, key


class KitchenUser(AnonymousUser):

    username = ""
    first_name = ""
    last_name = ""

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

    @property
    def is_kitchen(self):
        return True

class QRAuthentication(BaseTokenAuthentication):
    keyword = 'V-TOKEN'

    def authenticate_credentials(self, key):

        try:
            volunteer = models.Volunteer.objects.get(qr=key)

            if not volunteer.access_role:
                raise exceptions.AuthenticationFailed(_("No access rights"))

            user = QRUser()
            user.id = volunteer.pk
            user.username = volunteer.name
            user.first_name = volunteer.first_name
            user.last_name = volunteer.last_name
            user.access_role = volunteer.access_role
            user.uuid = volunteer.uuid


        except models.Volunteer.DoesNotExist:
            raise exceptions.AuthenticationFailed(_("Invalid token."))

        return user, key


class QRUser(AnonymousUser):
    username = ""
    first_name = ""
    last_name = ""
    access_role = ""
    uuid = ""

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

    @property
    def is_volunteer(self):
        return True
