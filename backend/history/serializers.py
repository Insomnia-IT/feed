from rest_framework import serializers

from feeder.models import Volunteer
from history.models import History


class HistorySerializer(serializers.ModelSerializer):
    actor_id = serializers.SerializerMethodField()

    class Meta:
        model = History
        fields = '__all__'

    def get_actor_id(self, obj):
        volunteer = Volunteer.objects.filter(uuid=obj.actor_badge)
        if volunteer:
            return volunteer[0].pk
        return None
