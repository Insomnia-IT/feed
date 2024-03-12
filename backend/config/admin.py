from django.contrib import admin

from django.contrib.admin import AdminSite
from django.contrib import admin

from feeder.models import *


class MyAdminSite(AdminSite):
    site_header = 'Кормитель DJ'
    site_title = 'Кормитель DJ'
    index_title = 'Настройки системы: Кормитель'


admin_site = MyAdminSite(name='admin')


admin_site.register(Volunteer)
admin_site.register(Location)
admin_site.register(Color)
admin_site.register(FeedType)
admin_site.register(FeedTransaction)
admin_site.register(Kitchen)
