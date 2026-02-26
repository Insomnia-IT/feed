from rest_framework import serializers

from django.db import transaction
from django.utils import timezone

from feeder import models
from feeder.utils import StatisticType
from feeder.views.mixins import get_request_user_id

from history.models import History

from uuid import UUID
from datetime import date

import arrow

TZ = 'Europe/Moscow'

class PhotoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Photo
        fields = '__all__'


class DirectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DirectionType
        fields = '__all__'


class DirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Direction
        fields = '__all__'


class ViewDirectionSerializer(serializers.ModelSerializer):
    type = DirectionTypeSerializer()

    class Meta:
        model = models.Direction
        fields = '__all__'


class EngagementRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EngagementRole
        fields = '__all__'


class EngagementSerializer(serializers.ModelSerializer):
    role = EngagementRoleSerializer()
    direction = DirectionSerializer()

    class Meta:
        model = models.Engagement
        fields = '__all__'


class DirectionNestedSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Direction
        fields = ['id', 'name']


class VolunteerCustomFieldSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.VolunteerCustomField
        fields = '__all__'


class VolunteerCustomFieldValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolunteerCustomFieldValue
        fields =  '__all__'


class VolunteerCustomFieldValueNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolunteerCustomFieldValue
        fields = ['custom_field', 'value']


class PersonSerializer(serializers.ModelSerializer):
    engagements = serializers.SerializerMethodField()

    def get_engagements(self, obj):
        return EngagementSerializer(
            obj.engagements.all().order_by('-year'),
            many=True
        ).data

    class Meta:
        model = models.Person
        fields = '__all__'


class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Transport
        fields = '__all__'


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Status
        fields = '__all__'


class ArrivalSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()
    class Meta:
        model = models.Arrival
        exclude = ["volunteer"]


class VolunteerListArrivalSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Arrival
        fields = ['id', 'arrival_date', 'departure_date', 'status', 'arrival_transport', 'departure_transport']

class SortArrivalsMixin:
    def to_representation(self, instance):
        response = super().to_representation(instance)
        response["arrivals"] = sorted(response["arrivals"], key=lambda x: x["arrival_date"])
        return response

class VolunteerListSerializer(SortArrivalsMixin, serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    directions = DirectionSerializer(many=True)
    custom_field_values = VolunteerCustomFieldValueNestedSerializer(many=True)
    arrivals = VolunteerListArrivalSerializer(many=True)
    supervisor = serializers.SerializerMethodField()

    class Meta:
        model = models.Volunteer
        fields = '__all__'
    
    def get_supervisor(self, volunteer):
        supervisor = getattr(volunteer, "supervisor_id", None)
        if supervisor:
            return {"id": supervisor.id, "name": supervisor.name}
        return None

class RetrieveVolunteerSerializer(SortArrivalsMixin, serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    custom_field_values = VolunteerCustomFieldValueNestedSerializer(many=True, required=False)
    arrivals = ArrivalSerializer(many=True)
    person = PersonSerializer(required=False, allow_null=True)
    color_type = serializers.SerializerMethodField(read_only=True)
    supervisor = serializers.SerializerMethodField()

    class Meta:
        model = models.Volunteer
        fields = '__all__'

    def get_color_type(self, volunteer):
        main_role = getattr(volunteer, 'main_role', None)
        if main_role:
            try:
                return models.Color.objects.get(name = main_role.color).id
            except models.Color.DoesNotExist:
                return None
    
    def get_supervisor(self, volunteer):
        supervisor = getattr(volunteer, "supervisor_id", None)
        if supervisor:
            return {"id": supervisor.id, "name": supervisor.name}
        return None

class VolunteerSerializer(SortArrivalsMixin, serializers.ModelSerializer):
    arrivals = ArrivalSerializer(many=True, required=False)
    directions = serializers.PrimaryKeyRelatedField(
        queryset=models.Direction.objects.all(),
        many=True
    )
    person_id = serializers.PrimaryKeyRelatedField(
        source='person', 
        queryset=models.Person.objects.all(),
        required=False
    )
    supervisor_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Volunteer.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = models.Volunteer
        exclude = ['person']

    def update(self, instance, validated_data):
        arrivals_data = None
        if 'arrivals' in validated_data:
            arrivals_data = validated_data.pop('arrivals')
        directions_data = validated_data.pop('directions', None)
        
        with transaction.atomic():
            instance = super().update(instance, validated_data)

            if directions_data is not None:
                instance.directions.set(directions_data)

            if arrivals_data is not None:
                self._process_arrivals(instance, arrivals_data, is_create=False)

        return instance
    
    def create(self, validated_data):
        arrivals_data = validated_data.pop('arrivals', [])
        directions_data = validated_data.pop('directions', [])
        
        with transaction.atomic():
            # Создаем волонтера через родительский метод
            volunteer = models.Volunteer.objects.create(**validated_data)

            # Устанавливаем направления
            volunteer.directions.set(directions_data)
            
            # Создаем связанные заезды
            self._process_arrivals(volunteer, arrivals_data, is_create=True)
            
        return volunteer
    
    def _process_arrivals(self, volunteer, arrivals_data, is_create=False):
        current_arrivals = {str(a.id): a for a in volunteer.arrivals.all()}
        processed_ids = set()
        group_op = self.context['group_op'] if 'group_op' in self.context else None
        group_arr_id = self.context['arr_id'] if 'arr_id' in self.context else None

        for arrival_data in arrivals_data:
            arrival_id = arrival_data.get('id')
            prepared_data = self._prepare_arrival_data(arrival_data)

            if is_create and arrival_id:
                prepared_data['id'] = arrival_id

            if arrival_id and str(arrival_id) in current_arrivals:
                # Обновление существующего заезда
                arrival = current_arrivals[str(arrival_id)]
                old_values = {field.name: getattr(arrival, field.name) for field in models.Arrival._meta.fields}
                
                if group_op and group_arr_id == arrival_id:
                    changed_data = {field: value for field, value in prepared_data.items()}
                else:
                    changed_data = {field: value for field, value in prepared_data.items() if getattr(arrival, field) != value}
                for attr, value in prepared_data.items():
                    setattr(arrival, attr, value)
                arrival.save()

                # Логируем изменения только если что-то изменилось
                if changed_data:
                    self._log_arrival_change(arrival, volunteer, "UPDATE", old_values, changed_data, group_op, group_arr_id)

                processed_ids.add(str(arrival_id))
            else:
                # Создание нового заезда
                arrival = models.Arrival.objects.create(volunteer=volunteer, **prepared_data)
                processed_ids.add(str(arrival.id))
                self._log_arrival_change(arrival, volunteer, "CREATE", {}, prepared_data, group_op, group_arr_id)

        # Удаление заездов, которых нет в обновленных данных
        if not is_create:
            to_delete = [aid for aid in current_arrivals if aid not in processed_ids]
            for aid in to_delete:
                arrival = current_arrivals[aid]
                old_values = {field.name: getattr(arrival, field.name) for field in models.Arrival._meta.fields}
                self._log_arrival_change(arrival, volunteer, "DELETE", old_values, {}, group_op, group_arr_id)
                arrival.delete()

    def _prepare_arrival_data(self, data):
        data = data.copy()

        relation_map = {
            'status': models.Status,
            'arrival_transport': models.Transport,
            'departure_transport': models.Transport
        }

        for field, model in relation_map.items():
            if field in data and isinstance(data[field], str):
                data[field] = model.objects.get(id=data[field])

        for date_field in ['arrival_date', 'departure_date']:
            if date_field in data and isinstance(data[date_field], str):
                dt_moscow = arrow.get(data[date_field]).to(TZ)
                data[date_field] = dt_moscow.format("YYYY-MM-DD")
        
        return data
    
    def _log_arrival_change(self, arrival, volunteer, action, old_data=None, new_data=None, group_op=None, group_arr_id=None):
        user_id = get_request_user_id(self.context["request"].user)

        def serialize_value(value):
            if isinstance(value, models.Status):
                return str(value.id)
            if isinstance(value, models.Transport):
                return str(value.id)
            if isinstance(value, date):  
                return value.isoformat()
            if isinstance(value, UUID):
                return str(value)
            return value

        old_data = {k: serialize_value(v) for k, v in (old_data or {}).items()}
        new_data = {k: serialize_value(v) for k, v in (new_data or {}).items()}

        if group_op and group_arr_id == arrival.id:
            changed_data = {k: v for k, v in new_data.items()}
        else:
            changed_data = {k: v for k, v in new_data.items() if old_data.get(k) != v}
        old_changed_data = {k: old_data[k] for k in changed_data.keys() if k in old_data}

        changed_data['id'] = arrival.id
        changed_data['badge'] = volunteer.uuid

        history_data = {
            "status": History.STATUS_UPDATE if action == "UPDATE" else History.STATUS_CREATE,
            "object_name": "arrival",
            "actor_badge": user_id,
            "action_at": timezone.now(),
            "data": changed_data,
            "old_data": old_changed_data,
            "volunteer_uuid": str(arrival.volunteer.uuid)
        }

        if action == "DELETE":
            history_data["status"] = History.STATUS_DELETE
            history_data["data"] = {"id": str(arrival.id), "deleted": True}

        if group_op:
            history_data["group_operation_uuid"] = str(group_op)

        if history_data["data"]:
            History.objects.create(**history_data)

class VolunteerRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolunteerRole
        fields = '__all__'

class GroupBadgePlanningCellsSerializer(serializers.ModelSerializer):
    feed_type_name = serializers.CharField(source='feed_type.name', read_only=True)
    group_badge_name = serializers.CharField(source='group_badge.name', read_only=True)
    
    class Meta:
        model = models.GroupBadgePlanningCells
        fields = '__all__'
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=models.GroupBadgePlanningCells.objects.all(),
                fields=['group_badge', 'feed_type', 'date'],
                message="Ячейка с такой комбинацией дата/групповой бейдж/тип питания уже существует."
            ),
        ]

class GroupBadgeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    planning_cells = GroupBadgePlanningCellsSerializer(
        many=True, 
        read_only=True,
        source='group_badge_planning_cells'
    )

    class Meta:
        model = models.GroupBadge
        fields = '__all__'


class GroupBadgeListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    direction = DirectionSerializer(required=False)
    planning_cells = GroupBadgePlanningCellsSerializer(
        many=True, 
        read_only=True,
        source='group_badge_planning_cells'
    )
    volunteer_count = serializers.IntegerField(
        source='volunteers.count',
        read_only=True
    )

    class Meta:
        model = models.GroupBadge
        fields = '__all__'


class ColorSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Color
        fields = '__all__'


class AccessRoleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = models.AccessRole
        fields = '__all__'


class GenderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = models.Gender
        fields = '__all__'


class FeedTypeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.FeedType
        fields = '__all__'


class FeedTransactionSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.FeedTransaction
        fields = '__all__'

    def create(self, validated_data):
        return models.FeedTransaction.objects.create(**validated_data)


class FeedTransactionDisplaySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    volunteer_name = serializers.SerializerMethodField()
    volunteer_first_name = serializers.SerializerMethodField()
    volunteer_last_name = serializers.SerializerMethodField()
    volunteer_directions = serializers.SerializerMethodField()
    kitchen_name = serializers.SerializerMethodField()
    group_badge_name = serializers.SerializerMethodField()

    class Meta:
        model = models.FeedTransaction
        fields = '__all__'

    def get_volunteer_name(self, obj):
        if obj.volunteer:
            return obj.volunteer.name
        else:
            return None

    def get_volunteer_first_name(self, obj):
        if obj.volunteer:
            return obj.volunteer.first_name
        else:
            return None

    def get_volunteer_last_name(self, obj):
        if obj.volunteer:
            return obj.volunteer.last_name
        else:
            return None

    def get_volunteer_directions(self, obj):
        if obj.volunteer:
            return [d.name for d in obj.volunteer.directions.all()]
        else:
            return None

    def get_kitchen_name(self, obj):
        if obj.kitchen:
            return obj.kitchen.name
        else:
            return None

    def get_group_badge_name(self, obj):
        if obj.group_badge:
            return obj.group_badge.name
        else:
            return None

    def create(self, validated_data):
        return models.FeedTransaction.objects.create(**validated_data)

class SyncFeedTransactionSerializer(serializers.ModelSerializer):
    """Сериализатор для операции синхронизации, который не проверяет уникальность ulid"""
    ulid = serializers.CharField(max_length=255)

    class Meta:
        model = models.FeedTransaction
        fields = '__all__'
        extra_kwargs = {
            'ulid': {'validators': []}
        }

class KitchenSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Kitchen
        fields = ['id', 'name', 'comment']

class FilterStatisticsSerializer(serializers.Serializer):
    date_from = serializers.DateField()
    date_to = serializers.DateField()
    anonymous = serializers.BooleanField(allow_null=True, default=None)
    group_badge = serializers.BooleanField(allow_null=True, default=None)
    prediction_alg = serializers.CharField(allow_null=True, default=None)
    apply_history = serializers.BooleanField(allow_null=True, default=None)

class StatisticsSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    date = serializers.DateField()
    type = serializers.ChoiceField(choices=[type.value for type in StatisticType])
    is_vegan = serializers.BooleanField(allow_null=True)
    meal_time = serializers.CharField(max_length=10, validators=[models.validate_meal_time])
    amount = serializers.IntegerField(min_value=0)
    kitchen_id = serializers.IntegerField(allow_null=True)


class SyncWithFeederRequestSerializer(serializers.Serializer):
    last_updated = serializers.DateTimeField(allow_null=True)
    transactions = SyncFeedTransactionSerializer(many=True)
    kitchen_id = serializers.IntegerField(allow_null=True)


class SyncWithFeederResponseSerializer(serializers.Serializer):
    last_updated = serializers.DateTimeField(allow_null=True)
    transactions = FeedTransactionSerializer(many=True)


class SimpleResponse(serializers.Serializer):
    success = serializers.BooleanField()


class UserDetailSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    id = serializers.CharField()
    roles = serializers.SerializerMethodField()
    kitchen = KitchenSerializer(required=False)
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    def get_roles(self, user):
        if getattr(user, 'is_kitchen', None):
            return ["KITCHEN", ]
        if getattr(user, 'is_volunteer', None):
            return [getattr(user, 'access_role', None), ]
        if user.is_staff or user.is_superuser:
            return ["ADMIN", ]


class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Transport
        fields = '__all__'

class WashSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Wash
        fields = '__all__'

class WashListSerializer(serializers.ModelSerializer):
    volunteer = VolunteerListSerializer()
    actor = VolunteerListSerializer()

    class Meta:
        model = models.Wash
        fields = '__all__'

class GroupData(serializers.Serializer):
    field = serializers.CharField()
    data = serializers.CharField()

class VolunteerGroupSerializer(serializers.Serializer):
    volunteers_ids = serializers.ListField(child = serializers.IntegerField())
    arrival_field_list = GroupData(many=True)
    field_list = GroupData(many=True, allow_empty=True)
    custom_field_list = GroupData(many=True, allow_empty=True)
