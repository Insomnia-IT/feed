from rest_framework import serializers, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.db import transaction
from django.db import OperationalError
import time
from rest_framework.exceptions import ValidationError

from feeder import serializers, models
from config.metrics import record_sqlite_busy

class SyncWithFeeder(APIView):
    """
    Синхронизация транзакций с базой данных Кормителя
    """
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.SyncWithFeederRequestSerializer(),
        responses={
            200: serializers.SyncWithFeederResponseSerializer()
        },
    )

    def post(self, request):
        serializer = serializers.SyncWithFeederRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_client_txs = serializer.validated_data.get('transactions')
        last_updated = serializer.validated_data.get('last_updated')
        kitchen_id = serializer.validated_data.get('kitchen_id')
        authenticated_kitchen_id = getattr(request.user, 'id', None)
        if getattr(request.user, 'is_kitchen', False) and kitchen_id != authenticated_kitchen_id:
            raise ValidationError({'kitchen_id': 'does_not_match_authenticated_kitchen'})
        if any(tx['kitchen'].id != kitchen_id for tx in new_client_txs):
            raise ValidationError({'transactions': 'transaction_kitchen_mismatch'})

        for attempt in range(3):
            try:
                with transaction.atomic():
                    return self._sync_transactions(
                        new_client_txs=new_client_txs, last_updated=last_updated, kitchen_id=kitchen_id
                    )
            except OperationalError as exc:
                if "locked" not in str(exc).lower() and "busy" not in str(exc).lower():
                    raise
                record_sqlite_busy()
                if attempt == 2:
                    return Response({"detail": "database_busy_retry"}, status=503)
                time.sleep(0.05 * (2 ** attempt))

    def _sync_transactions(self, *, new_client_txs, last_updated, kitchen_id):
        kitchen_transactions = models.FeedTransaction.objects.filter(kitchen_id=kitchen_id)
        if last_updated:
            kitchen_transactions = kitchen_transactions.filter(created_at__gt=last_updated)
        new_server_txs = list(kitchen_transactions.order_by('created_at', 'ulid'))
        for tx in new_client_txs:
            existing = models.FeedTransaction.objects.filter(ulid=tx['ulid']).first()
            if existing and existing.kitchen_id != kitchen_id:
                raise ValidationError({'transactions': 'ulid_belongs_to_another_kitchen'})
            if not existing:
                models.FeedTransaction.objects.create(**tx)
        last_tx = models.FeedTransaction.objects.filter(kitchen_id=kitchen_id).order_by('created_at', 'ulid').last()
        result = {"transactions": new_server_txs, "last_updated": last_tx.created_at if last_tx else None}
        return Response(serializers.SyncWithFeederResponseSerializer(result).data)
