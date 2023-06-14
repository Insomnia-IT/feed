import arrow

from django.shortcuts import render, get_object_or_404
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from rest_framework import status
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter, OpenApiExample
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import routers, serializers, viewsets, permissions
from rest_framework.views import APIView
from django_filters import rest_framework as django_filters

from feeder import serializers, models, authentication
from feeder.utils import sync_with_notion, calculate_statistics, STAT_DATE_FORMAT

class MultiSerializerViewSetMixin(object):
    def get_serializer_class(self):
        """
        Смотрим на serializer class в self.serializer_action_classes, который представляет из себя
        dict mapping action name (key) в serializer class (value), например::
        class MyViewSet(MultiSerializerViewSetMixin, ViewSet):
            serializer_class = MyDefaultSerializer
            serializer_action_classes = {
               'list': MyListSerializer,
               'my_action': MyActionSerializer,
            }

            @action
            def my_action:
                ...

        Если подходящих вхождений в action нет тогда просто fallback к обычному
        get_serializer_class lookup: self.serializer_class, DefaultSerializer.
        """
        try:
            return self.serializer_action_classes[self.action]
        except (KeyError, AttributeError):
            return super(MultiSerializerViewSetMixin, self).get_serializer_class()


class DepartmentFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Department
        fields = []

class DepartmentViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Department.objects.all()
    serializer_class = serializers.DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DepartmentFilter
    search_fields = ['name', ]

class VolunteerFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')
    lastname = django_filters.CharFilter(field_name="lastname", lookup_expr='icontains')
    nickname = django_filters.CharFilter(field_name="nickname", lookup_expr='icontains')
    phone = django_filters.CharFilter(field_name="phone", lookup_expr='icontains')
    email = django_filters.CharFilter(field_name="email", lookup_expr='icontains')
    qr = django_filters.CharFilter(field_name="qr", lookup_expr='iexact')

    class Meta:
        model = models.Volunteer
        fields = ['departments', 'color_type', 'feed_type', 'kitchen']

class VolunteerViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Volunteer.objects.all()
    serializer_class = serializers.VolunteerSerializer
    serializer_action_classes = {
        'list': serializers.VolunteerListSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'lastname', 'nickname', 'phone', 'email', 'qr']
    filterset_class = VolunteerFilter


class LocationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class ColorViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


@extend_schema(tags=['feed', ])
class FeedTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.FeedType.objects.all()
    serializer_class = serializers.FeedTypeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class FeedTransactionFilter(django_filters.FilterSet):
    dtime_from = django_filters.IsoDateTimeFilter(field_name="dtime", lookup_expr='gte')
    dtime_to = django_filters.IsoDateTimeFilter(field_name="dtime", lookup_expr='lte')

    class Meta:
        model = models.FeedTransaction
        fields = ['kitchen']

@extend_schema(tags=['feed', ])
class FeedTransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.FeedTransaction.objects.all()
    serializer_class = serializers.FeedTransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['volunteer__nickname', ]
    filterset_class = FeedTransactionFilter
    ordering = ('-dtime')


class KitchenViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Kitchen.objects.all()
    serializer_class = serializers.KitchenSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class SyncWithNotion(APIView):
    """
    Синхронизация Volunteer с Notion
    """
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(responses={200: serializers.SyncStatistic}, summary="Запуск синхронизации с Notion")
    def post(self, request):
        result = sync_with_notion()
        return Response(
            serializers.SyncStatistic(result).data
        )


@extend_schema(tags=['feed', ], summary="Массовое добавление приёмов пищи")
class FeedTransactionBulk(APIView):
    """
    Работа с массивом кормёжек
    """
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.FeedTransactionSerializer(many=True),
        responses={200: serializers.SimpleResponse},
    )
    def post(self, request):

        serializer = serializers.FeedTransactionSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializers.SimpleResponse({'success': True}).data
        )


class UpdateBalance(APIView):
    """
    """
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request):
        """
            vols = vols_by_date(query=Volunteer.query, active=True).all()

            for v in vols:
                if v.is_blocked:
                    continue

                if v.feed_type is None:
                    continue

                v.daily_eats = v.feed_type.daily_amount

                db.session.add(v)

            u = User.query.first()
            u.last_reset = datetime.datetime.now()
            db.session.add(u)

            db.session.commit()
        """


class Statistics(APIView):
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="date_from",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="Begining of period. Optional. Default is today. Value must be in '{}' format.".format(STAT_DATE_FORMAT),
                examples=[
                    OpenApiExample('Yesterday', value=arrow.now().shift(days=-1).format(STAT_DATE_FORMAT)),
                    OpenApiExample('Today', value=arrow.now().format(STAT_DATE_FORMAT))
                ]
            ),
            OpenApiParameter(
                name="date_to",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="End of period. Optional. Default is today. Value must be in '{}' format.".format(STAT_DATE_FORMAT),
                examples=[
                    OpenApiExample('Today', value=arrow.now().format(STAT_DATE_FORMAT)),
                    OpenApiExample('Tomorrow', value=arrow.now().shift(days=+1).format(STAT_DATE_FORMAT))
                ]
            )
        ],
        responses={
            200: serializers.StatisticsResponseSerializer(many=True)
        },
    )
    def get(self, request):
        today = arrow.now().format(STAT_DATE_FORMAT)

        date_from = request.GET.get('date_from', today)
        date_to = request.GET.get('date_to', today)

        serializer = serializers.StatisticsRequestSerializer(data={ 'date_from': date_from, 'date_to': date_to })
        serializer.is_valid(raise_exception=True)

        result = calculate_statistics(serializer.data)

        return Response(
            serializers.StatisticsResponseSerializer(result, many=True).data
        )
