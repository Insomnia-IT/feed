from django.contrib import admin

from config.admin import admin_site
from history.models import History


class HistoryAdmin(admin.ModelAdmin):
    list_display = (
        "status", "object_name", "volunteer_uuid", "action_at", "actor_badge", "by_sync",
    )
    search_fields = (
        "object_name", "status", "actor_badge",
    )

    def by_sync(self, obj):
        return not obj.actor_badge

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin_site.register(History, HistoryAdmin)
