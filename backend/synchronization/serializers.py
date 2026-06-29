from rest_framework import serializers


class SyncStatusSerializer(serializers.Serializer):
    lastSyncDate = serializers.DateTimeField(allow_null=True)
    isError = serializers.BooleanField()
