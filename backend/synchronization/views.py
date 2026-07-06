from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from synchronization.notion import NotionSync
from synchronization.models import SynchronizationSystemActions
from synchronization.serializers import SyncStatusSerializer


class SyncWithNotion(APIView):
    """
    Синхронизация Volunteer с Notion
    """
    permission_classes = [permissions.AllowAny, ]

    def post(self, request):
        all_data = True if request.query_params.get('all_data') else False
        NotionSync().main(all_data=all_data)
        return Response(status=HTTP_204_NO_CONTENT)


class SyncStatus(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: SyncStatusSerializer})
    def get(self, request):
        syncs = SynchronizationSystemActions.objects.filter(
            system=SynchronizationSystemActions.SYSTEM_NOTION,
        )
        incoming_syncs = syncs.filter(direction=SynchronizationSystemActions.DIRECTION_FROM_SYSTEM)
        last_successful_date = (
            incoming_syncs.filter(success=True)
            .order_by("-date", "-id")
            .values_list("date", flat=True)
            .first()
        )
        last_sync_attempt = (
            syncs
            .order_by("-date", "-id")
            .values_list("success", flat=True)
            .first()
        )

        serializer = SyncStatusSerializer({
            "lastSyncDate": last_successful_date,
            "isError": last_sync_attempt is False,
        })
        return Response(serializer.data)
