from uuid import uuid4
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from feeder.mixins import TimeMixin, CommentMixin, NameMixin
from feeder.soft_delete import SoftDeleteModelMixin


def gen_uuid():
    return str(uuid4())


class Direction(TimeMixin, CommentMixin):
    """ Службы и локации """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.ForeignKey('DirectionType', on_delete=models.PROTECT)
    first_year = models.IntegerField(null=True, blank=True)
    last_year = models.IntegerField(null=True, blank=True)
    notion_id = models.CharField(max_length=255, db_index=True, null=True, blank=True)


class Arrival(TimeMixin, CommentMixin):
    """ Пребывание (заезды и отъезды) """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    volunteer = models.ForeignKey('Volunteer', on_delete=models.CASCADE, related_name="arrivals")
    status = models.ForeignKey('Status', null=True, blank=True, on_delete=models.PROTECT)
    arrival_date = models.DateField()
    arrival_transport = models.ForeignKey('Transport', on_delete=models.PROTECT, null=True, blank=True, related_name="arrivals")
    arrival_registered = models.DateTimeField(null=True, blank=True)
    departure_date = models.DateField()
    departure_transport = models.ForeignKey('Transport', on_delete=models.PROTECT, null=True, blank=True, related_name="departures")
    departure_registered = models.DateTimeField(null=True, blank=True)


class Status(TimeMixin):
    id = models.CharField(max_length=20, verbose_name="Код", primary_key=True)
    name = models.CharField(max_length=255, verbose_name="Наименование")
    visible = models.CharField(max_length=255, verbose_name="В список")
    description = models.CharField(max_length=255, verbose_name="Примечание")


class Transport(TimeMixin):
    """ Транспорт (Способы въезда и выезда) """
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255)


class VolunteerRole(TimeMixin):
    """ Роли волонтеров """
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=6)
    is_leader = models.BooleanField(default=False)
    is_team = models.BooleanField(default=False)


class DirectionType(TimeMixin):
    """ Типы служб и локаций """
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255)
    is_federal = models.BooleanField(default=False)


class Gender(TimeMixin):
    """ Пол """
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255)


class Person(TimeMixin, CommentMixin):
    """ Личность """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    nickname = models.CharField(max_length=255, null=True, blank=True)
    other_names = models.TextField(null=True, blank=True)
    gender = models.ForeignKey(Gender, null=True, blank=True, on_delete=models.PROTECT)
    birth_date = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    telegram = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    is_vegan = models.BooleanField(default=False)
    notion_id = models.CharField(max_length=255, db_index=True)


class Photo(TimeMixin):
    """ Фотографии (людей) """
    file_name = models.CharField(max_length=1000)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)


class EngagementRole(TimeMixin):
    """ Роли в участии """
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255)
    is_team = models.BooleanField(default=False)


class Engagement(TimeMixin):
    """ Участие """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    year = models.IntegerField()
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="engagements")
    direction = models.ForeignKey(Direction, on_delete=models.PROTECT)
    role = models.ForeignKey(EngagementRole, on_delete=models.PROTECT)
    position = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    notion_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)


class Volunteer(TimeMixin, SoftDeleteModelMixin):
    """ Волонтеры """
    uuid = models.UUIDField(default=gen_uuid, unique=True, db_index=True)
    person = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, blank=True)
    gender = models.ForeignKey(Gender, on_delete=models.PROTECT, null=True, blank=True)
    parent = models.ForeignKey('Volunteer', on_delete=models.SET_NULL, null=True, blank=True, related_name="parents")
    directions = models.ManyToManyField(Direction, blank=True)

    first_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Имя")
    last_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Фамилия")
    name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Имя на бейдже")
    phone = models.CharField(max_length=255, null=True, blank=True, verbose_name="Телефон")
    email = models.CharField(max_length=255, null=True, blank=True, verbose_name="E-mail")
    photo = models.TextField(null=True, blank=True, verbose_name="Фотография")
    position = models.TextField(null=True, blank=True, verbose_name="")
    qr = models.TextField(unique=True, null=True, blank=True, verbose_name="QR-код")
    is_blocked = models.BooleanField(default=False, verbose_name="Заблокирован?")
    is_ticket_received = models.BooleanField(default=False, verbose_name="Выдан ли билет?")
    is_vegan = models.BooleanField(default=False, verbose_name="Вегетарианец?")
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")
    direction_head_comment = models.TextField(null=True, blank=True, verbose_name="Комментарий руководителя локации")
    badge_number = models.TextField(null=True, blank=True, verbose_name="Номер бейджа")
    printing_batch = models.IntegerField(null=True, blank=True, verbose_name="Партия бейджа")
    # role = models.TextField(null=True, blank=True, verbose_name="Роль")
    access_role = models.ForeignKey(
        'AccessRole',
        null=True, blank=True, on_delete=models.PROTECT,
        related_name='volunteers',
        verbose_name="Право доступа",
    )
    group_badge = models.ForeignKey('GroupBadge', null=True, blank=True, on_delete=models.SET_NULL, related_name='volunteers', verbose_name="Групповой бейдж")
    feed_type = models.ForeignKey('FeedType', null=True, blank=True, on_delete=models.PROTECT, verbose_name="Тип питания")
    kitchen = models.ForeignKey('Kitchen', null=True, blank=True, on_delete=models.PROTECT, verbose_name="Кухня")
    main_role = models.ForeignKey(VolunteerRole, on_delete=models.PROTECT, null=True, blank=True)
    notion_id = models.CharField(max_length=255, db_index=True, null=True, blank=True)
    scanner_comment = models.CharField(max_length=255, null=True, blank=True, verbose_name="Комментарий при сканировании")
    responsible_id = models.ForeignKey('Volunteer', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='volunteers',
        verbose_name="Ответственный")
    is_child = models.BooleanField('IsChild', null=True, blank=True, default=False)

    class Meta:
        verbose_name = "Волонтёр"
        verbose_name_plural = "Волонтёры"

    def __str__(self):
        return u"{} ({})".format(self.first_name, self.name)

    @property
    def paid(self):
        return self.feed_type != 1

    def save(self, *args, **kwargs):
        if not self.pk and not self.qr and self.notion_id:
            self.qr = str(self.notion_id).replace("-", "")
        super().save(*args, **kwargs)

class Kitchen(TimeMixin):
    name = models.CharField(max_length=255, verbose_name="Название")
    pin_code = models.CharField(max_length=255, verbose_name="Код авторизации", unique=True, db_index=True)
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Кухня"
        verbose_name_plural = "Кухни"


class GroupBadge(TimeMixin, CommentMixin, NameMixin):
    qr = models.TextField(unique=True, verbose_name="QR-код")
    direction = models.ForeignKey(Direction, on_delete=models.PROTECT, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Групповой бейдж"
        verbose_name_plural = "Групповые бейджи"


class VolunteerCustomField(TimeMixin, CommentMixin):
    name = models.CharField(verbose_name='Название', unique=True, max_length=100)
    type = models.CharField(verbose_name='Тип данных', max_length=20)
    mobile = models.BooleanField(null=False, default=False, verbose_name="Показывать в мобильной админке?")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Кастомное поле волонтера"
        verbose_name_plural = "Кастомные поля волонтера"


class VolunteerCustomFieldValue(TimeMixin):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, verbose_name="Волонтер", related_name="custom_field_values")
    custom_field = models.ForeignKey(VolunteerCustomField, on_delete=models.CASCADE, verbose_name="Кастомное поле")
    value = models.TextField(verbose_name='Значение')

    def __str__(self):
        return self.value

    class Meta:
        verbose_name = "Значение кастомного поля волонтера"
        verbose_name_plural = "Значения кастомных полей волонтера"
        constraints = [
            models.UniqueConstraint(fields=['volunteer', 'custom_field'], name='unique fields')
        ]

class Color(TimeMixin):
    name = models.CharField(max_length=255, verbose_name="Название")
    description = models.CharField(max_length=255, null=True, blank=True, verbose_name="Описание")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Цвет бэджика"
        verbose_name_plural = "Цвета бэджика"


class AccessRole(TimeMixin):
    id = models.CharField(max_length=20, verbose_name="Идентификатор", primary_key=True)
    name = models.CharField(max_length=255, verbose_name="название")
    description = models.CharField(max_length=255, null=True, blank=True, verbose_name="Описание")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Право доступа"
        verbose_name_plural = "Права доступа"


class FeedType(TimeMixin):
    name = models.CharField(max_length=255, unique=True, verbose_name="Название")
    code = models.CharField(max_length=3, unique=True, verbose_name="Код")
    paid = models.BooleanField(default=False, verbose_name="Оплачено?")
    daily_amount = models.IntegerField(default=0, verbose_name="Дневное количество")
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Тип питания"
        verbose_name_plural = "Типы питания"


meal_times = [ "breakfast", "lunch", "dinner", "night" ]


def validate_meal_time(value):
    if value not in meal_times:
        raise ValidationError(
            _("%(value)s is not one of the possible values: %(meal_times)s"),
            params={"value": value, "meal_times": ", ".join(meal_times)},
        )


class FeedTransaction(TimeMixin):
    ulid = models.CharField(max_length=255, primary_key=True)
    volunteer = models.ForeignKey(Volunteer, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Волонтёр")
    group_badge = models.ForeignKey(GroupBadge, null=True, blank=True, on_delete=models.SET_NULL, related_name='feed_transactions', verbose_name="Групповой бейдж")
    is_vegan = models.BooleanField(null=True, verbose_name="Вегетарианец?")
    kitchen = models.ForeignKey(Kitchen, on_delete=models.PROTECT, verbose_name="Кухня")
    amount = models.IntegerField(default=0, verbose_name="Количество")
    reason = models.CharField(max_length=255, null=True, blank=True, verbose_name="Причина")
    dtime = models.DateTimeField()
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")
    meal_time = models.TextField(max_length=10, verbose_name="Время питания", validators=[validate_meal_time])

    class Meta:
        verbose_name = "Приём пищи"
        verbose_name_plural = "Приёмы пищи"

class Volunteer_group_operation(models.Model):
    group_operation_id = models.CharField(max_length=255, primary_key=True)
    volunteers_ids = models.JSONField()#models.ManyToManyField(Volunteer)
    original_data = models.JSONField()
    new_data = models.JSONField()



    def __str__(self):
        return self.group_operation_id

    class Meta:
        verbose_name =  "Групповая операция"
        verbose_name_plural = "Групповые операции"
