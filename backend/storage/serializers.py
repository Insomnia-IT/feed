# storage/serializers.py

"""Serializers for the Storage Management feature.
All fields are exposed; ``id`` is read‑only (automatically added by Django).
"""

from rest_framework import serializers

from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving


class StorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storage
        fields = "__all__"
        read_only_fields = ("id",)


class BinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bin
        fields = "__all__"
        read_only_fields = ("id",)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = "__all__"
        read_only_fields = ("id",)


class StorageItemPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageItemPosition
        fields = "__all__"
        read_only_fields = ("id",)


class IssuanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issuance
        fields = "__all__"
        read_only_fields = ("id",)


class ReceivingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receiving
        fields = "__all__"
        read_only_fields = ("id",)
