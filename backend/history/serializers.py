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
        supervisor_id = obj.data.get("supervisor_id")
        if supervisor_id:
            try:
                volunteer = Volunteer.objects.get(uuid=supervisor_id)
                extendedData['supervisor'] = {
                    "id": volunteer.pk,
                    "name": volunteer.name
                }
            except Exception:
                pass
        return dict(obj.data, **extendedData)


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
