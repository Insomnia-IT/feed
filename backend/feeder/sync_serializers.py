from rest_framework import serializers

from feeder.models import Volunteer, Arrival


class VolunteerHistoryDataSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="uuid", read_only=True)
    deleted = serializers.SerializerMethodField()
    gender = serializers.SlugRelatedField(read_only=True, slug_field="name")
    vegan = serializers.BooleanField(source="is_vegan", read_only=True)
    feed = serializers.SlugRelatedField(source="feed_type", read_only=True, slug_field="name")
    number = serializers.CharField(source="badge_number", read_only=True)
    batch = serializers.CharField(source="printing_batch", read_only=True)
    person = serializers.PrimaryKeyRelatedField(read_only=True)
    departments = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model = Volunteer
        fields = (
            "id", "deleted", "name", "first_name", "last_name", "gender", "phone",
            "vegan", "feed", "number", "batch", "role", "position", "photo",
            "person", "comment", "notion_id", "departments",
        )

    def get_deleted(self, obj):
        if hasattr(obj, "deleted_at") and obj.deleted_at:
            return True
        return False


class ArrivalHistoryDataSerializer(serializers.ModelSerializer):
    deleted = serializers.SerializerMethodField()
    badge = serializers.CharField(source="volunteer.uuid", read_only=True)
    status = serializers.SlugRelatedField(read_only=True, slug_field="name")
    arrival_transport = serializers.SlugRelatedField(read_only=True, slug_field="name")
    departure_transport = serializers.SlugRelatedField(read_only=True, slug_field="name")

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


def get_history_serializer(instance_name):
    instance_serializer = {
        "volunteer": VolunteerHistoryDataSerializer,
        "arrival": ArrivalHistoryDataSerializer
    }
    return instance_serializer.get(instance_name)
