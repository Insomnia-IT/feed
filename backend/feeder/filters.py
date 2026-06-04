from django.db import connections
from django.db.models import F, Func, Q, TextField, Value
from django.db.models.functions import Cast, Lower, Replace
from rest_framework.filters import SearchFilter

from feeder.search_normalization import SEARCH_NORMALIZE_FUNCTION, normalize_search_text


class NormalizedSearchFilter(SearchFilter):
    """
    Makes `е` and `ё` equivalent for DRF search fields.

    The filter keeps the default SearchFilter behavior for queries that do not
    contain either letter, so unrelated searches continue to use the stock path.
    """

    @staticmethod
    def _build_normalized_expression(field_name: str, vendor: str):
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

    def filter_queryset(self, request, queryset, view):
        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)

        if not search_fields or not search_terms:
            return queryset

        plain_terms = []
        normalized_terms = []
        for term in search_terms:
            if "е" in term.casefold() or "ё" in term.casefold():
                normalized_terms.append(normalize_search_text(term))
            else:
                plain_terms.append(term)

        orm_lookups = [
            self.construct_search(str(search_field), queryset)
            for search_field in search_fields
        ]

        for term in plain_terms:
            term_query = Q()
            for lookup in orm_lookups:
                term_query |= Q(**{lookup: term})
            queryset = queryset.filter(term_query)

        if normalized_terms:
            aliases = {field_name: f"_norm_search_{index}" for index, field_name in enumerate(search_fields)}
            vendor = connections[queryset.db].vendor
            queryset = queryset.annotate(
                **{
                    alias: self._build_normalized_expression(field_name, vendor)
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
