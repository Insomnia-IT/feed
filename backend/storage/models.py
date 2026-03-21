from django.db import models
from feeder.mixins import TimeMixin
from feeder.soft_delete import SoftDeleteModelMixin
from feeder.models import Volunteer

class Storage(TimeMixin, SoftDeleteModelMixin):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Bin(TimeMixin, SoftDeleteModelMixin):
    storage = models.ForeignKey(Storage, on_delete=models.CASCADE, related_name="bins")
    name = models.CharField(max_length=255)
    capacity = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.storage.name} - {self.name}"

class Item(TimeMixin, SoftDeleteModelMixin):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, blank=True, null=True)
    is_unique = models.BooleanField(default=False)
    is_anonymous = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name

class StorageItemPosition(TimeMixin, SoftDeleteModelMixin):
    storage = models.ForeignKey(Storage, on_delete=models.PROTECT, related_name="positions")
    bin = models.ForeignKey(Bin, on_delete=models.PROTECT, related_name="positions")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="positions")
    count = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.item.name} in {self.bin.name} ({self.count})"

class Issuance(TimeMixin, SoftDeleteModelMixin):
    position = models.ForeignKey(StorageItemPosition, on_delete=models.PROTECT, related_name="issuances")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.PROTECT, related_name="issuances", blank=True, null=True)
    count = models.IntegerField()
    notes = models.TextField(blank=True, null=True)

class Receiving(TimeMixin, SoftDeleteModelMixin):
    position = models.ForeignKey(StorageItemPosition, on_delete=models.PROTECT, related_name="receivings")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.PROTECT, related_name="receivings", blank=True, null=True)
    count = models.IntegerField()
    notes = models.TextField(blank=True, null=True)
