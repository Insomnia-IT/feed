import uuid
from datetime import datetime

from django.db import models


def instance_id_field(instance_name):
    instance_id_dict = {
        "volunteer": "uuid",
        "arrival": "id"
    }
    return instance_id_dict.get(instance_name, "")


def get_volunteer_data(instance):
    data = {
        "name": instance.name,
        "first_name": instance.first_name,
        "last_name": instance.last_name,
        "gender": instance.gender.name if instance.gender else None,
        "phone": instance.phone,
        # "infant": True,
        "vegan": instance.is_vegan,
        "feed": instance.feed_type.name if instance.feed_type else None,
        "number": instance.badge_number,
        "batch": instance.printing_batch,
        "role": instance.role,
        "position": instance.position,
        "photo": instance.photo,
        "person": instance.person.id if instance.person else None,
        "comment": instance.comment,
        "notion_id": instance.notion_id,
        "departments": list(instance.departments.all().values_list("name", flat=True)),
    }
    return data


def get_arrival_data(instance):
    data = {
        "badge": str(instance.volunteer.uuid) if instance.volunteer else None,
        "arrival_date": instance.arrival_date.strftime("%Y-%m-%d") if instance.arrival_date else None,
        "arrival_transport": instance.arrival_transport.name if instance.arrival_transport else None,
        "arrival_registered": (instance.arrival_registered.strftime("%Y-%m-%d")
                               if instance.arrival_registered else None),
        "departure_date": instance.departure_date.strftime("%Y-%m-%d") if instance.departure_date else None,
        "departure_transport": instance.departure_transport.name if instance.departure_transport else None,
        "departure_registered": (instance.departure_registered.strftime("%Y-%m-%d")
                                 if instance.departure_registered else None),
    }
    return data


def get_instance_data(instance):
    func = {
        "volunteer": get_volunteer_data,
        "arrival": get_arrival_data,
    }
    instance_name = str(instance.__class__.__name__).lower()
    result = func.get(instance_name, None)
    if not result:
        raise ValueError({"history": f"get_data function for instance {instance_name} not found"})

    return result(instance)


class History(models.Model):
    STATUS_CREATE = "inserted"
    STATUS_UPDATE = "updated"
    STATUS_DELETE = "deleted"

    STATUS_CHOICES = (
        (STATUS_CREATE, "inserted"),
        (STATUS_UPDATE, "updated"),
        (STATUS_DELETE, "deleted")
    )
    object_id = models.UUIDField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    object = models.CharField(max_length=32)
    actor_badge = models.UUIDField(blank=True, null=True)
    date = models.DateTimeField()
    data = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = "История"
        verbose_name_plural = "История"

    def __str__(self):
        return f"{self.object} - {self.status}"

    def entry_creation(self, status, instance, request_user_uuid, instance_id=None):
        self.status = status
        self.object = str(instance.__class__.__name__).lower()
        self.actor_badge = request_user_uuid
        id_field = instance_id_field(self.object)
        object_id = getattr(instance, id_field)
        self.object_id = object_id if isinstance(object_id, uuid.UUID) else instance_id
        if status == self.STATUS_CREATE:
            self.date = instance.created_at if hasattr(instance, "created_at") else datetime.utcnow()
            self.data = get_instance_data(instance)
        elif status == self.STATUS_UPDATE:
            self.date = instance.updated_at if hasattr(instance, "updated_at") else datetime.utcnow()
            self.data = get_instance_data(instance)
        else:
            self.date = instance.deleted_at if hasattr(instance, "deleted_at") else datetime.utcnow()
        self.save()