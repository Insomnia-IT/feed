from rest_framework import serializers
from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving

class StorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storage
        fields = '__all__'

class BinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bin
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
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
