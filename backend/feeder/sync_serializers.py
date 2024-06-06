from datetime import datetime

from rest_framework import serializers

from feeder.models import (Volunteer, Arrival, Direction, Gender, FeedType, DirectionType, Person, Status, Transport,
                           Engagement, EngagementRole, VolunteerCustomFieldValue)
from history.models import History


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
    gender = serializers.SlugRelatedField(slug_field="id", queryset=Gender.objects.all(), required=False)
    vegan = serializers.BooleanField(source="is_vegan", required=False)
    infant = serializers.SerializerMethodField()
    feed = serializers.SlugRelatedField(source="feed_type", slug_field="id",
                                        queryset=FeedType.objects.all(), required=False)
    number = serializers.CharField(source="badge_number", required=False)
    batch = serializers.IntegerField(source="printing_batch", required=False)
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), required=False)
    directions = serializers.SlugRelatedField(many=True, slug_field="id",
                                              queryset=Direction.objects.all(), required=False)

    class Meta:
        model = Volunteer
        fields = (
            "id", "deleted", "name", "first_name", "last_name", "gender", "phone",
            "infant", "vegan", "feed", "number", "batch", "role", "position", "photo",
            "person", "comment", "notion_id", "directions", "email", "qr", "is_blocked", "comment",
            "direction_head_comment",
            "access_role", "color_type", "group_badge", "kitchen", "main_role"
        )
        uuid_field = "uuid"

    def get_deleted(self, obj):
        if hasattr(obj, "deleted_at") and obj.deleted_at:
            return True
        return False

    def get_infant(self, obj):
        feed = obj.feed_type
        if feed and feed.name == "ребенок":
            obj.feed_type = FeedType.objects.get(name="фри")
            return True
        return False

    def get_instance_by_uuid(self, uuid):
        model = self.Meta.model
        return model.objects.filter(uuid=uuid).first()

    def validate(self, attrs):
        infant = self.initial_data.get("infant")
        if infant:
            attrs["feed_type"] = FeedType.objects.get(name="ребенок")
        return super().validate(attrs)


class ArrivalHistoryDataSerializer(serializers.ModelSerializer):
    deleted = serializers.SerializerMethodField()
    badge = serializers.CharField(source="volunteer.uuid")
    status = serializers.SlugRelatedField(slug_field="id", queryset=Status.objects.all())
    arrival_transport = serializers.SlugRelatedField(slug_field="id", queryset=Transport.objects.all())
    departure_transport = serializers.SlugRelatedField(slug_field="id", queryset=Transport.objects.all())

    class Meta:
        model = Arrival
        fields = (
            "id", "deleted", "badge", "status", "arrival_date",
            "arrival_transport", "departure_date", "departure_transport",
        )

    def get_deleted(self, obj):
        if hasattr(obj, "deleted_at") and obj.deleted_at:
            return True
        return False


class DirectionHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="id", queryset=DirectionType.objects.all())

    class Meta:
        model = Direction
        fields = (
            "id", "name", "first_year", "last_year", "type", "notion_id"
        )


class EngagementHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), required=False)
    role = serializers.SlugRelatedField(slug_field="id", queryset=EngagementRole.objects.all(), required=False)
    direction = serializers.PrimaryKeyRelatedField(queryset=Direction.objects.all(), required=False)

    class Meta:
        model = Engagement
        fields = (
            "id", "year", "person", "role", "position", "status", "direction", "notion_id"
        )


class PersonHistoryDataSerializer(SaveSyncSerializerMixin, serializers.ModelSerializer):
    vegan = serializers.BooleanField(source="is_vegan", required=False)

    class Meta:
        model = Person
        fields = (
            "id", "name", "first_name", "last_name", "nickname", "other_names", "gender", "birth_date",
            "phone", "telegram", "email", "city", "vegan", "notion_id"
        )


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
