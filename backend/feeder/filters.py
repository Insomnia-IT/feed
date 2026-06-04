from django.db import connections
from django.db.models import F, Func, Q, TextField, Value
from django.db.models.functions import Cast, Lower, Replace
from rest_framework.filters import SearchFilter

from feeder.search_normalization import SEARCH_NORMALIZE_FUNCTION, normalize_search_text


def build_normalized_field_expression(field_name: str, vendor: str):
    if vendor == "sqlite":
        return Func(
            Cast(F(field_name), TextField()),
            function=SEARCH_NORMALIZE_FUNCTION,
            output_field=TextField(),
        )

    return Replace(
        Lower(Cast(F(field_name), TextField()), output_field=TextField()),
        Value("ё"),
        Value("е"),
        output_field=TextField(),
    )


def apply_normalized_contains(queryset, field_name: str, value: str, *, alias_prefix: str = "_norm"):
    if not value:
        return queryset

    normalized_value = normalize_search_text(value)
    vendor = connections[queryset.db].vendor
    alias = f"{alias_prefix}_{field_name.replace('__', '_')}"
    return queryset.annotate(**{alias: build_normalized_field_expression(field_name, vendor)}).filter(
        **{f"{alias}__contains": normalized_value}
    )


class NormalizedSearchFilter(SearchFilter):
    """
    Case-insensitive DRF search with `е`/`ё` normalization.

    Uses the same normalized field expression as `apply_normalized_contains` so
    SQLite dev (without ASCII-only UPPER) matches PostgreSQL deploy behavior.
    """

    def filter_queryset(self, request, queryset, view):
        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)

        if not search_fields or not search_terms:
            return queryset

        normalized_terms = [normalize_search_text(term) for term in search_terms]
        aliases = {field_name: f"_norm_search_{index}" for index, field_name in enumerate(search_fields)}
        vendor = connections[queryset.db].vendor
        queryset = queryset.annotate(
            **{
                alias: build_normalized_field_expression(field_name, vendor)
                for field_name, alias in aliases.items()
            }
        )

        for term in normalized_terms:
            term_query = Q()
            for alias in aliases.values():
                term_query |= Q(**{f"{alias}__contains": term})
            queryset = queryset.filter(term_query)

        if self.must_call_distinct(queryset, search_fields):
            queryset = queryset.distinct()

        return queryset
