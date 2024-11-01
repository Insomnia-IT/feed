from rest_framework import serializers, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.db import transaction

from feeder import serializers, models

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

    @transaction.atomic
    def post(self, request):
        serializer = serializers.SyncWithFeederRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_client_txs = serializer.data.get('transactions')
        last_updated = serializer.data.get('last_updated')
        kitchen_id = serializer.data.get('kitchen_id')

        # Выбираем новые транзакции для Кормителя
        new_server_txs = list(models.FeedTransaction.objects.filter(created_at__gt=last_updated, kitchen_id=kitchen_id))
        # Записываем новые клиентские транзакции в бд
        new_client_txs_serializer = serializers.FeedTransactionSerializer(data=new_client_txs, many=True)
        new_client_txs_serializer.is_valid(raise_exception=True)
        new_client_txs_serializer.save()

        last_tx = models.FeedTransaction.objects.order_by('created_at').last()

        result = {}

        result['transactions'] = new_server_txs
        if (last_tx):
            # last_updated - Время записи последней транзакции
            result['last_updated'] = last_tx.created_at

        return Response(
            serializers.SyncWithFeederResponseSerializer(result).data
        )
