from rest_framework import serializers

from feeder.models import Volunteer
from history.models import History


class HistorySerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    by_sync = serializers.SerializerMethodField()

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

    def get_by_sync(self, obj):
        return not obj.actor_badge
