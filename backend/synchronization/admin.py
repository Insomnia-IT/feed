from django.contrib import admin

from config.admin import admin_site
from synchronization.models import SynchronizationSystemActions


class SynchronizationAdmin(admin.ModelAdmin):
    list_display = (
        "success", "date", "system", "direction", "partial_offset", "error",
    )
    search_fields = (
        "direction", "system", "error"
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return True

    def has_change_permission(self, request, obj=None):
        return False


admin_site.register(SynchronizationSystemActions, SynchronizationAdmin)
