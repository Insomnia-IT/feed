from rest_framework import serializers

from feeder.models import Volunteer
from history.models import History


class HistorySerializer(serializers.ModelSerializer):
    actor_id = serializers.SerializerMethodField()
    created_by_sync = serializers.SerializerMethodField()

    class Meta:
        model = History
        fields = '__all__'

    def get_actor_id(self, obj):
        try:
            volunteer = Volunteer.objects.get(uuid=obj.actor_badge)
            return volunteer.pk
        except Exception:
            return None

    def get_created_by_sync(self, obj):
        return not obj.actor_badge
