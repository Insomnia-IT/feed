from rest_framework import serializers

from feeder.models import Volunteer
from history.models import History


class HistorySerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    volunteer = serializers.SerializerMethodField()
    by_sync = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = History
        fields = '__all__'

    def get_actor(self, obj):
        try:
            volunteer = Volunteer.objects.get(uuid=obj.actor_badge)
            return {
                "id": volunteer.pk,
                "name": volunteer.name
            }
        except Exception:
            return None

    def get_volunteer(self, obj):
        try:
            volunteer = Volunteer.objects.get(uuid=obj.volunteer_uuid)
            return {
                "id": volunteer.pk,
                "name": volunteer.name
            }
        except Exception:
            return None
    def get_by_sync(self, obj):
        return not obj.actor_badge
    
    def get_data(self, obj):
        extendedData = {}
        self._extend_related_volunteer(extendedData, obj.data, "supervisor_id", "supervisor")
        self._extend_related_volunteer(extendedData, obj.data, "responsible_id", "responsible")
        return dict(obj.data, **extendedData)

    def _extend_related_volunteer(self, extended_data, data, id_key, result_key):
        volunteer_uuid = data.get(id_key)
        if not volunteer_uuid:
            return
        try:
            volunteer = Volunteer.objects.get(uuid=volunteer_uuid)
            extended_data[result_key] = {
                "id": volunteer.pk,
                "name": volunteer.name
            }
        except Exception:
            pass


class HistorySyncSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source="action_at")
    actor_badge = serializers.SerializerMethodField()

    class Meta:
        model = History
        fields = ("actor_badge", "date", "data")

    def get_actor_badge(self, obj):
        badge = obj.actor_badge
        if badge and len(badge) < 32:
            return None
        return badge
