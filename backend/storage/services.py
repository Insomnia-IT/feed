from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import StorageItemPosition, VolunteerInventory


def increase_volunteer_inventory(volunteer_id, position: StorageItemPosition, count: int):
    if not volunteer_id or position.item.is_anonymous or count <= 0:
        return

    inventory, _ = VolunteerInventory.objects.select_for_update().get_or_create(
        volunteer_id=volunteer_id,
        position=position,
        defaults={"count": 0}
    )
    inventory.count += count
    inventory.save(update_fields=["count", "updated_at"])


def transfer_volunteer_inventory(position: StorageItemPosition, from_volunteer_id: int, to_volunteer_id: int, count: int):
    if count <= 0:
        raise ValidationError({"count": "Count must be positive"})

    if from_volunteer_id == to_volunteer_id:
        raise ValidationError({"to": "Target volunteer must differ from source volunteer"})

    with transaction.atomic():
        try:
            source_inventory = VolunteerInventory.objects.select_for_update().get(
                volunteer_id=from_volunteer_id,
                position=position
            )
        except VolunteerInventory.DoesNotExist as exc:
            raise ValidationError({"count": "Insufficient inventory"}) from exc

        if source_inventory.count < count:
            raise ValidationError({"count": "Insufficient inventory"})

        source_inventory.count -= count
        if source_inventory.count:
            source_inventory.save(update_fields=["count", "updated_at"])
        else:
            source_inventory.delete()

        increase_volunteer_inventory(to_volunteer_id, position, count)
