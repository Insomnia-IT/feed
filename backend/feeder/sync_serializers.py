from rest_framework import serializers

from feeder.models import Volunteer, Arrival, Direction, Gender, FeedType, DirectionType, Person


class VolunteerHistoryDataSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="uuid")
    deleted = serializers.SerializerMethodField()
    gender = serializers.SlugRelatedField(slug_field="name", read_only=True) #get_queryset=Gender.objects.all())
    vegan = serializers.BooleanField(source="is_vegan")
    feed = serializers.SlugRelatedField(source="feed_type", slug_field="name", read_only=True) # get_queryset=FeedType.objects.all())
    number = serializers.CharField(source="badge_number")
    batch = serializers.CharField(source="printing_batch")
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    directions = serializers.SlugRelatedField(many=True, slug_field="name", read_only=True) # get_queryset=Direction.objects.all())

    class Meta:
        model = Volunteer
        fields = (
            "id", "deleted", "name", "first_name", "last_name", "gender", "phone",
            "vegan", "feed", "number", "batch", "role", "position", "photo",
            "person", "comment", "notion_id", "directions",
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


class DirectionHistoryDataSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="name", queryset=DirectionType.objects.all())

    class Meta:
        model = Direction
        fields = (
            "id", "name", "first_year", "last_year", "type", "notion_id"
        )

    def save(self, **kwargs):
        model = self.Meta.model
        uuid = self.validated_data.get("id")
        instance = model.objects.filter(id=uuid).first()
        if instance:
            self.instance = instance

        super().save(**kwargs)
        return self.instance
