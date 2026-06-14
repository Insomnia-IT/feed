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
            direction=SynchronizationSystemActions.DIRECTION_FROM_SYSTEM,
        )
        last_successful_sync = syncs.filter(success=True).order_by("-date", "-id").first()
        last_sync_attempt = syncs.order_by("-date", "-id").first()

        serializer = SyncStatusSerializer({
            "lastSyncDate": last_successful_sync.date if last_successful_sync else None,
            "isError": bool(last_sync_attempt and not last_sync_attempt.success),
        })
        return Response(serializer.data)
