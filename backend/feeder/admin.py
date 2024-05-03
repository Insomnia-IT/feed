from django.contrib import admin

from config.admin import admin_site
from feeder.models import Volunteer


class VolunteerAdmin(admin.ModelAdmin):
    list_display = (
        "uuid", "is_active", "is_deleted", "created_at", "updated_at", "first_name", "last_name", "name"
    )
    search_fields = (
        "uuid", "first_name", "last_name", "name"
    )

    def is_deleted(self, obj):
        return bool(obj.deleted_at)


admin_site.register(Volunteer, VolunteerAdmin)
