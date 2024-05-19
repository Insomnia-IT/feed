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
    readonly_fields = (
        "deleted_at", "name", "first_name", "last_name", "gender", "phone", "is_vegan",
        "feed_type", "badge_number", "printing_batch", "role", "position", "photo",
        "person", "comment", "notion_id", "directions"
    )
    fieldsets = (
        (None, {"fields": ("uuid", "name", "first_name", "last_name", "person", "gender", "photo")}),
        ("Status", {"fields": ("is_active", "is_blocked",)}),
        ("Contacts", {"fields": ("email", "phone",)}),
        (" ", {"fields": ("parent", "ref_to", "comment")}),
        (" ", {"fields": ("directions", "role", "access_role", "departments", "main_role", "position", )}),
        (" ", {"fields": ("qr", "badge_number", "printing_batch", "group_badge", "color_type", "notion_id")}),
        ("Dates", {"fields": ("active_from", "active_to", "arrival_date", "departure_date")}),
        ("Kitchen", {"fields": ("kitchen", "feed_type", "daily_eats", "balance", "is_vegan", )}),
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
