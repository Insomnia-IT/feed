from django.contrib import admin

from django.contrib.admin import AdminSite
from django.contrib import admin

from feeder.models import *


class MyAdminSite(AdminSite):
    site_header = 'Кормитель DJ'
    site_title = 'Кормитель DJ'
    index_title = 'Настройки системы: Кормитель'


admin_site = MyAdminSite(name='admin')


admin_site.register(Location)
admin_site.register(Color)
admin_site.register(FeedType)
admin_site.register(FeedTransaction)
admin_site.register(Kitchen)
admin_site.register(Department)
admin_site.register(Direction)
admin_site.register(Arrival)
admin_site.register(Transport)
admin_site.register(VolunteerRole)
admin_site.register(DirectionType)
admin_site.register(Gender)
admin_site.register(Person)
admin_site.register(Photo)
admin_site.register(Engagement)
admin_site.register(EngagementRole)
admin_site.register(AccessRole)
admin_site.register(Status)
