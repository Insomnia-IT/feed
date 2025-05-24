from datetime import datetime

from rest_framework import serializers

from feeder.models import (Volunteer, Arrival, Direction, FeedType, DirectionType, Person, Status, Transport,
                           Engagement, EngagementRole, VolunteerCustomFieldValue, VolunteerRole, Kitchen)
from history.models import History

from django.conf import settings

class SaveSyncSerializerMixin(object):
    class Meta:
        abstract = True

    def get_instance_by_uuid(self, uuid):
        model = self.Meta.model
        return model.objects.filter(id=uuid).first()

    def save_history(self, status, data, old_data=None):
        if not data:
            return
        instance_name = str(self.Meta.model.__name__).lower()
        history = {
                "status": status,
                "object_name": instance_name,
                "action_at": self.instance.updated_at if hasattr(self.instance, "updated_at") else datetime.utcnow(),
                "data": data
            }
        if old_data:
            history.update({"old_data": old_data})
        if hasattr(self.instance, "volunteer"):
            history.update({"volunteer_uuid": str(self.instance.volunteer.uuid)})
        elif instance_name == "volunteer":
            history.update({"volunteer_uuid": str(self.instance.uuid)})
        History.objects.create(**history)

    def delete_instance(self):
        data = {
            "id": str(self.instance.uuid) if hasattr(self.instance, "uuid") else str(self.instance.id),
            "deleted": True
        }
        self.instance.delete()
        self.save_history(status=History.STATUS_DELETE, data=data)

    def save(self, **kwargs):
        uuid = self.initial_data.get("id")
        instance = self.get_instance_by_uuid(uuid)
        old_data = {}
        if instance:
            self.instance = instance
            old_data = self.__class__(instance).data
        elif not hasattr(self.Meta, "uuid_field") or self.Meta.uuid_field == "id":
            self.validated_data["id"] = uuid

        if settings.SKIP_BACK_SYNC and hasattr(self, "activated") and not self.activated:
            return self.instance

        super().save(**kwargs)

        new_data = self.data
        if old_data:
            status = History.STATUS_UPDATE
            changed_data = {}
            for key, val in new_data.items():
                if val == old_data.get(key):
                    old_data.pop(key)
                else:
                    changed_data.update({key: val})
            if changed_data:
                changed_data.update({"id": uuid})
        else:
            status = History.STATUS_CREATE
            changed_data = new_data

        self.save_history(status=status, data=changed_data, old_data=old_data)

        if self.initial_data.get("deleted", False):
            self.delete_instance()

        return self.instance


class VolunteerHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    id = serializers.UUIDField(source="uuid")
    deleted = serializers.SerializerMethodField()
    activated = serializers.SerializerMethodField()
    vegan = serializers.BooleanField(source="is_vegan", required=False)
    infant = serializers.SerializerMethodField()
    feed = serializers.SerializerMethodField()
    number = serializers.CharField(source="badge_number", required=False, allow_blank=True, allow_null=True)
    batch = serializers.CharField(source="printing_batch", required=False, allow_blank=True, allow_null=True)
    role = serializers.SlugRelatedField(source="main_role", slug_field="id",
                                        queryset=VolunteerRole.objects.all(), required=False)

    class Meta:
        model = Volunteer
        fields = (
            "id", "deleted", "name", "first_name", "last_name", "gender", "phone",
            "infant", "vegan", "feed", "number", "batch", "role", "position", "photo",
            "person", "comment", "directions", "email", "qr", "is_blocked", "comment",
            "direction_head_comment",
            "access_role", "group_badge", "kitchen", "main_role", "feed_type",
            "activated"
        )
        uuid_field = "uuid"

    def get_deleted(self, obj):
        if hasattr(obj, "deleted_at") and obj.deleted_at:
            return True
        return False
    
    def get_activated(self, obj):
        return Arrival.objects.filter(
            status__in=['ARRIVED', 'STARTED', 'JOINED'],
            volunteer=obj.id
        ).count() > 0

    def get_infant(self, obj):
        feed = obj.feed_type
        if feed and feed.name == "ребенок":
            return True
        return False

    def get_feed(self, obj):
        feed = obj.feed_type
        if not feed or feed.name == "без питания":
            return "NO"
        if feed.name == "ребенок" or feed.name == "фри":
            return "FREE"
        return "PAID"

    def get_instance_by_uuid(self, uuid):
        model = self.Meta.model
        return model.objects.filter(uuid=uuid).first()

    def to_internal_value(self, data):
        if data.get("batch") == "None":
            data["batch"] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        infant = self.initial_data.get("infant")
        feed = self.initial_data.get("feed", "")
        if infant:
            attrs["feed_type"] = FeedType.objects.get(name="ребенок")
        elif feed == "FREE":
            attrs["feed_type"] = FeedType.objects.get(name="фри")
        elif feed == "PAID":
            attrs["feed_type"] = FeedType.objects.get(name="платно")
        elif feed == "NO":
            attrs["feed_type"] = FeedType.objects.get(name="без питания")

        kitchen = attrs.get("kitchen")
        if not kitchen:
            attrs["kitchen"] = Kitchen.objects.get(name="Кухня №1")
        return super().validate(attrs)


class ArrivalHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    deleted = serializers.SerializerMethodField()
    activated = serializers.SerializerMethodField()
    badge = serializers.SlugRelatedField(source="volunteer", slug_field="uuid", queryset=Volunteer.objects.all())
    status = serializers.SlugRelatedField(slug_field="id", queryset=Status.objects.all())
    arrival_transport = serializers.SlugRelatedField(slug_field="id", queryset=Transport.objects.all())
    departure_transport = serializers.SlugRelatedField(slug_field="id", queryset=Transport.objects.all())

    class Meta:
        model = Arrival
        fields = (
            "id", "deleted", "badge", "status", "arrival_date",
            "arrival_transport", "departure_date", "departure_transport",
            "activated"
        )

    def get_deleted(self, obj):
        if hasattr(obj, "deleted_at") and obj.deleted_at:
            return True
        return False
    
    def get_activated(self, obj):
        return obj.status in ['ARRIVED', 'STARTED', 'JOINED']


class DirectionHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="id", queryset=DirectionType.objects.all())

    class Meta:
        model = Direction
        fields = (
            "id", "name", "first_year", "last_year", "type"
        )


class EngagementHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), required=False)
    role = serializers.SlugRelatedField(slug_field="id", queryset=EngagementRole.objects.all(), required=False)
    direction = serializers.PrimaryKeyRelatedField(queryset=Direction.objects.all(), required=False)

    class Meta:
        model = Engagement
        fields = (
            "id", "year", "person", "role", "position", "status", "direction"
        )


class PersonHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    vegan = serializers.BooleanField(source="is_vegan", required=False)

    class Meta:
        model = Person
        fields = (
            "id", "name", "first_name", "last_name", "nickname", "other_names", "gender", "birth_date",
            "phone", "telegram", "email", "city", "vegan"
        )

    def to_internal_value(self, data):
        if not data.get('name', None):
            data["name"] = "-"
        return super().to_internal_value(data)


class VolunteerCustomFieldValueHistoryDataSerializer(serializers.ModelSerializer):
    volunteer = serializers.CharField(source="volunteer.uuid")

    class Meta:
        model = VolunteerCustomFieldValue
        fields = ("id", "volunteer", "value", "custom_field")


def get_history_serializer(instance_name):
    instance_serializer = {
        "volunteer": VolunteerHistoryDataSerializer,
        "arrival": ArrivalHistoryDataSerializer,
        "direction": DirectionHistoryDataSerializer,
        "engagement": EngagementHistoryDataSerializer,
        "person": PersonHistoryDataSerializer,
        "volunteercustomfieldvalue": VolunteerCustomFieldValueHistoryDataSerializer,
    }
    return instance_serializer.get(instance_name)
