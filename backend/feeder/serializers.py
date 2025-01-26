from rest_framework import routers, serializers, viewsets

from feeder import models
from feeder.utils import StatisticType


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
    engagements = EngagementSerializer(many=True)

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
    class Meta:
        model = models.Arrival
        fields = '__all__'

class VolunteerListArrivalSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Arrival
        fields = ['arrival_date', 'departure_date', 'status', 'arrival_transport', 'departure_transport']


class VolunteerListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    directions = DirectionSerializer(many=True)
    custom_field_values = VolunteerCustomFieldValueNestedSerializer(many=True)
    arrivals = VolunteerListArrivalSerializer(many=True)

    class Meta:
        model = models.Volunteer
        fields = '__all__'



class RetrieveVolunteerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    custom_field_values = VolunteerCustomFieldValueNestedSerializer(many=True, required=False)
    arrivals = ArrivalSerializer(many=True)
    person = PersonSerializer(required=False, allow_null=True)
    color_type = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = models.Volunteer
        fields = '__all__'

    def get_color_type(self, volunteer):
        main_role = getattr(volunteer, 'main_role', None)
        if main_role:
            return models.Color.objects.get(name = main_role.color).id


class VolunteerSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Volunteer
        exclude = ['person']

class VolunteerRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolunteerRole
        fields = '__all__'


class GroupBadgeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.GroupBadge
        fields = '__all__'

class GroupBadgeListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    direction = DirectionSerializer(required=False)
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
    id = serializers.IntegerField(read_only=True)
    # volunteer_name = serializers.SerializerMethodField()
    # kitchen_name = serializers.SerializerMethodField()

    class Meta:
        model = models.FeedTransaction
        fields = '__all__'

    # def get_volunteer_name(self, obj):
    #     if obj.volunteer:
    #         return obj.volunteer.name
    #     else:
    #         return None

    # def get_kitchen_name(self, obj):
    #     if obj.kitchen:
    #         return obj.kitchen.name
    #     else:
    #         return None

    def create(self, validated_data):
        return models.FeedTransaction.objects.create(**validated_data)


class KitchenSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.Kitchen
        fields = ['id', 'name', 'comment']

class FilterStatisticsSerializer(serializers.Serializer):
    date_from = serializers.DateField()
    date_to = serializers.DateField()


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
    transactions = FeedTransactionSerializer(many=True)
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
