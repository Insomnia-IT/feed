from django.contrib import admin

from config.admin import admin_site
from feeder.models import Volunteer, Arrival, Person


class VolunteerAdmin(admin.ModelAdmin):
    list_display = (
        "uuid", "is_deleted", "created_at", "updated_at", "first_name", "last_name", "name"
    )
    search_fields = (
        "uuid", "first_name", "last_name", "name"
    )
    readonly_fields = (
        "uuid", "deleted_at", "name", "first_name", "last_name", "gender", "phone", "is_vegan",
        "feed_type", "badge_number", "printing_batch", "position", "photo",
        "person", "comment", "directions"
    )
    fieldsets = (
        (None, {"fields": ("uuid", "name", "first_name", "last_name", "person", "gender", "photo")}),
        ("Status", {"fields": ("is_blocked",)}),
        ("Contacts", {"fields": ("email", "phone",)}),
        (" ", {"fields": ("parent", "comment")}),
        (" ", {"fields": ("directions", "access_role", "main_role", "position", )}),
        (" ", {"fields": ("qr", "badge_number", "printing_batch", "group_badge")}),
        ("Kitchen", {"fields": ("kitchen", "feed_type", "is_vegan", )}),
    )

    def is_deleted(self, obj):
        return bool(obj.deleted_at)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "id", "first_name", "last_name", "name", "nickname", "other_names", "telegram"
    )
    search_fields = (
        "id", "first_name", "last_name", "name", "nickname", "other_names", "telegram"
    )

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
admin_site.register(Person, PersonAdmin)
