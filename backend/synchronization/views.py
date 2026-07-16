from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.conf import settings
import subprocess
import sys
import uuid

from synchronization.models import SynchronizationSystemActions
from synchronization.serializers import SyncStatusSerializer
from synchronization.notion import reserve_sync_dispatch, release_sync_dispatch


class SyncWithNotion(APIView):
    """
    Синхронизация Volunteer с Notion
    """
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(request=None, responses={202: dict})
    def post(self, request):
        token = str(uuid.uuid4())
        try:
            reserve_sync_dispatch(token)
        except FileExistsError:
            return Response({"status": "already_running"}, status=202)
        all_data = True if request.query_params.get('all_data') else False
        command = [sys.executable, "manage.py", "run_external_sync", "--reservation-token", token]
        if all_data:
            command.append("--all-data")
        try:
            subprocess.Popen(command, cwd=settings.BASE_DIR, close_fds=True)
        except OSError:
            release_sync_dispatch(token)
            return Response({"status": "launch_failed"}, status=503)
        return Response({"status": "started"}, status=202)


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
