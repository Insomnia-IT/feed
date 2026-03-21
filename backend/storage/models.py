# storage/models.py

"""Models for the Storage Management feature.

All models inherit ``TimeMixin`` for ``created_at`` and ``updated_at`` timestamps
and ``SoftDeleteModelMixin`` for soft‑delete support where appropriate.
"""

from django.db import models
from django.db.models import JSONField

# Import mixins from the existing feeder app
from feeder.mixins import TimeMixin
from feeder.soft_delete import SoftDeleteModelMixin

# Volunteer model lives in the feeder app
from feeder.models import Volunteer


class Storage(TimeMixin, SoftDeleteModelMixin):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Storage"
        verbose_name_plural = "Storages"

    def __str__(self):
        return self.name


class Bin(TimeMixin, SoftDeleteModelMixin):
    storage = models.ForeignKey(Storage, on_delete=models.CASCADE, related_name="bins")
    name = models.CharField(max_length=255)
    capacity = models.IntegerField(blank=True, null=True, help_text="Optional maximum item count for the bin")
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Bin"
        verbose_name_plural = "Bins"
        unique_together = ("storage", "name")

    def __str__(self):
        return f"{self.storage.name} / {self.name}"


class Item(TimeMixin, SoftDeleteModelMixin):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, blank=True, null=True, help_text="Optional identifier")
    is_unique = models.BooleanField(default=False, help_text="True for items that exist only once (count always 1)")
    metadata = JSONField(blank=True, null=True, help_text="Free‑form data for the item")

    class Meta:
        verbose_name = "Item"
        verbose_name_plural = "Items"
        unique_together = ("name", "sku")

    def __str__(self):
        return self.name


class StorageItemPosition(TimeMixin, SoftDeleteModelMixin):
    storage = models.ForeignKey(Storage, on_delete=models.PROTECT, related_name="positions")
    bin = models.ForeignKey(Bin, on_delete=models.PROTECT, related_name="positions")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="positions")
    count = models.IntegerField(help_text="1 for unique items, >0 for non‑unique")
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Storage Item Position"
        verbose_name_plural = "Storage Item Positions"
        unique_together = ("storage", "bin", "item")

    def __str__(self):
        return f"Pos {self.id}: {self.item.name} x{self.count} in {self.bin.name} ({self.storage.name})"


class Issuance(TimeMixin, SoftDeleteModelMixin):
    position = models.ForeignKey(StorageItemPosition, on_delete=models.PROTECT, related_name="issuances")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.PROTECT, related_name="issuances")
    count = models.IntegerField(help_text="For non‑unique items this is the issued amount; for unique items always 1")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Issuance"
        verbose_name_plural = "Issuances"

    def __str__(self):
        return f"Issued {self.count} of {self.position.item.name} to {self.volunteer}"


class Receiving(TimeMixin, SoftDeleteModelMixin):
    position = models.ForeignKey(StorageItemPosition, on_delete=models.PROTECT, related_name="receivings")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.PROTECT, related_name="receivings", help_text="Who delivered the items")
    count = models.IntegerField(help_text="Number of items received")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Receiving"
        verbose_name_plural = "Receivings"

    def __str__(self):
        return f"Received {self.count} of {self.position.item.name} from {self.volunteer}"
