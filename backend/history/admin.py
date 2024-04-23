from django.contrib import admin
from django_admin_listfilter_dropdown.filters import ChoiceDropdownFilter, RelatedDropdownFilter
from rangefilter.filters import DateRangeFilter

from history.models import History


class HistoryAdmin(admin.ModelAdmin):
    list_display = (
        "status", "object", "date", "actor_badge"
    )
    list_filter = (
        ("date", DateRangeFilter),
        ("status", ChoiceDropdownFilter),
        ("object", RelatedDropdownFilter),
    )


admin.site.register(History, HistoryAdmin)

