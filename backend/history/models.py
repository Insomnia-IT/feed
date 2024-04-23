from datetime import datetime

from django.db import models


def get_volunteer_data(instance):
    data = {
        "id": instance.uuid,
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


def get_instance_data(instance):
    func = {
        "volunteer": get_volunteer_data
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

    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    object = models.CharField(max_length=32)
    actor_badge = models.UUIDField(blank=True, null=True)
    date = models.DateTimeField()
    data = models.JSONField()

    class Meta:
        verbose_name = "История"
        verbose_name_plural = "История"

    def __str__(self):
        return f"{self.object} - {self.status}"

    def entry_creation(self, status, instance, request_user_uuid):
        self.status = status
        self.object = str(instance.__class__.__name__).lower()
        self.actor_badge = request_user_uuid
        if status == self.STATUS_CREATE:
            self.date = instance.created_at
        elif status == self.STATUS_UPDATE:
            self.date = instance.updated_at
        else:
            self.date = datetime.now()
        self.data = get_instance_data(instance)
        self.save()


