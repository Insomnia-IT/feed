from uuid import uuid4
from datetime import datetime
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from feeder.mixins import TimeMixin, CommentMixin, NameMixin


def gen_uuid():
    return str(uuid4())


class Volunteer(TimeMixin):
    uuid = models.UUIDField(default=gen_uuid, unique=True, db_index=True)
    name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Имя")
    lastname = models.CharField(max_length=255, null=True, blank=True, verbose_name="Фамилия")
    nickname = models.CharField(max_length=255, null=True, blank=True, verbose_name="Ник")
    phone = models.CharField(max_length=255, null=True, blank=True, verbose_name="Телефон")
    email = models.CharField(max_length=255, null=True, blank=True, verbose_name="E-mail")
    photo = models.TextField(null=True, blank=True, verbose_name="Фотография")
    position = models.TextField(null=True, blank=True, verbose_name="")
    qr = models.TextField(unique=True, null=True, blank=True, verbose_name="QR-код")
    active_from = models.DateTimeField(null=True, blank=True, verbose_name="Активен с ")
    active_to = models.DateTimeField(null=True, blank=True, verbose_name="Активен до")
    arrival_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата прибытия")
    departure_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата отъезда")
    daily_eats = models.IntegerField(default=0, verbose_name="Количество приёмов пищи в день")
    balance = models.IntegerField(default=0, verbose_name="Баланс")
    is_active = models.BooleanField(default=False, verbose_name="Активен?")
    is_blocked = models.BooleanField(default=False, verbose_name="Заблокирован?")
    is_vegan = models.BooleanField(default=False, verbose_name="Вегетарианец?")
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")
    badge_number = models.TextField(null=True, blank=True, verbose_name="Номер бейджа")

    departments = models.ManyToManyField('Department', verbose_name="Департамент")
    color_type = models.ForeignKey(
        'Color',
        null=True, blank=True, on_delete=models.PROTECT,
        related_name='volunteers',
        verbose_name="Цвет бэджика",
    )
    group_badge = models.ForeignKey('GroupBadge', null=True, blank=True, on_delete=models.PROTECT, verbose_name="Групповой бейдж")
    feed_type = models.ForeignKey('FeedType', null=True, blank=True, on_delete=models.PROTECT, verbose_name="Тип питания")
    kitchen = models.ForeignKey('Kitchen', null=True, blank=True, on_delete=models.PROTECT, verbose_name="Кухня")
    ref_to = models.ForeignKey('Volunteer', null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Связан с ")

    class Meta:
        verbose_name = "Волонтёр"
        verbose_name_plural = "Волонтёры"

    def __str__(self):
        return u"{} ({})".format(self.name, self.nickname)

    @property
    def expired(self):
        now = datetime.today()
        expired = 0
        if self.active_to and now > self.active_to:
            expired = 1

        if self.active_from and now < self.active_from:
            expired = -1
        return expired

    @property
    def paid(self):
        return self.feed_type != 1


class Department(TimeMixin):
    name = models.CharField(max_length=255, verbose_name="Название", db_index=True)
    code = models.CharField(max_length=255, null=True, blank=True, verbose_name="Код")
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")
    lead = models.ForeignKey(
        'Volunteer', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='department_leader',
        verbose_name="Лидер",
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Департамент"
        verbose_name_plural = "Департаменты"


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
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Групповой бейдж"
        verbose_name_plural = "Групповые бейджи"


class Location(TimeMixin):
    name = models.CharField(max_length=255, verbose_name="Название", db_index=True)
    code = models.CharField(max_length=255, null=True, blank=True, verbose_name="Код")
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Локация"
        verbose_name_plural = "Локации"


class Color(TimeMixin):
    name = models.CharField(max_length=255, verbose_name="Название")
    description = models.CharField(max_length=255, null=True, blank=True, verbose_name="Описание")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Цвет бэджика"
        verbose_name_plural = "Цвета бэджика"


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
    if not value in meal_times:
        raise ValidationError(
            _("%(value)s is not one of the possible values: %(meal_times)s"),
            params={"value": value, "meal_times": ", ".join(meal_times)},
        )

class FeedTransaction(TimeMixin):
    ulid = models.CharField(max_length=255, primary_key=True)
    volunteer = models.ForeignKey(Volunteer, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Волонтёр")
    is_vegan = models.BooleanField(verbose_name="Вегетарианец?")
    kitchen = models.ForeignKey(Kitchen, on_delete=models.PROTECT, verbose_name="Кухня")
    amount = models.IntegerField(default=0, verbose_name="Количество")
    reason = models.CharField(max_length=255, null=True, blank=True, verbose_name="Причина")
    dtime = models.DateTimeField()
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")
    meal_time = models.TextField(max_length=10, verbose_name="Время питания", validators=[validate_meal_time])

    class Meta:
        verbose_name = "Приём пищи"
        verbose_name_plural = "Приёмы пищи"
