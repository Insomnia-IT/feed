from django.db import transaction
from rest_framework import serializers
from feeder.models import Volunteer
from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving, Movement, VolunteerInventory
from .services import transfer_volunteer_inventory


class StorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storage
        fields = '__all__'


class BinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bin
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    storage_name = serializers.ReadOnlyField(source='storage.name')

    class Meta:
        model = Item
        fields = '__all__'


class StorageItemPositionSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.name')
    bin_name = serializers.ReadOnlyField(source='bin.name')
    storage_name = serializers.ReadOnlyField(source='storage.name')
    item_is_unique = serializers.ReadOnlyField(source='item.is_unique')
    item_is_anonymous = serializers.ReadOnlyField(source='item.is_anonymous')

    class Meta:
        model = StorageItemPosition
        fields = '__all__'


class IssuanceSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.ReadOnlyField(source='volunteer.name')
    item_name = serializers.ReadOnlyField(source='position.item.name')

    class Meta:
        model = Issuance
        fields = '__all__'


class ReceivingSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.ReadOnlyField(source='volunteer.name')
    item_name = serializers.ReadOnlyField(source='position.item.name')

    class Meta:
        model = Receiving
        fields = '__all__'


class MovementSerializer(serializers.ModelSerializer):
    from_volunteer = serializers.PrimaryKeyRelatedField(queryset=Volunteer.objects.all(), write_only=True)
    to_volunteer = serializers.PrimaryKeyRelatedField(queryset=Volunteer.objects.all(), write_only=True)

    class Meta:
        model = Movement
        fields = ["id", "position", "count", "from_volunteer", "to_volunteer", "created_at", "updated_at"]

    def to_internal_value(self, data):
        if "from" in data or "to" in data:
            data = data.copy()
            if "from" in data:
                data["from_volunteer"] = data.pop("from")
            if "to" in data:
                data["to_volunteer"] = data.pop("to")
        return super().to_internal_value(data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["from"] = instance.from_volunteer_id
        representation["to"] = instance.to_volunteer_id
        representation.pop("from_volunteer", None)
        representation.pop("to_volunteer", None)
        return representation

    def create(self, validated_data):
        position = validated_data["position"]
        count = validated_data["count"]
        from_volunteer = validated_data["from_volunteer"]
        to_volunteer = validated_data["to_volunteer"]

        with transaction.atomic():
            transfer_volunteer_inventory(position, from_volunteer.id, to_volunteer.id, count)
            return Movement.objects.create(**validated_data)


class VolunteerInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerInventory
        fields = ["position", "count"]
