from django.contrib import admin

from config.admin import admin_site
from feeder.models import Volunteer, Arrival


class VolunteerAdmin(admin.ModelAdmin):
    list_display = (
        "uuid", "is_active", "is_deleted", "created_at", "updated_at", "first_name", "last_name", "name"
    )
    search_fields = (
        "uuid", "first_name", "last_name", "name"
    )

    def is_deleted(self, obj):
        return bool(obj.deleted_at)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ArrivalAdmin(admin.ModelAdmin):
    list_display = (
        "volunteer", "status", "arrival_date", "arrival_registered", "arrival_transport",
        "departure_date", "departure_registered", "departure_transport"
    )
    search_fields = (
        "volunteer", "status"
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin_site.register(Volunteer, VolunteerAdmin)
admin_site.register(Arrival, ArrivalAdmin)
