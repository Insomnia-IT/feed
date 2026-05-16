from __future__ import annotations

from datetime import datetime, timezone as datetime_timezone
from typing import Iterable, Sequence
from zoneinfo import ZoneInfo

from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
XLSX_EXPORT_TIMEZONE = ZoneInfo("Europe/Moscow")


def get_xlsx_export_timezone() -> ZoneInfo:
    return XLSX_EXPORT_TIMEZONE


def format_xlsx_datetime(value: datetime | None) -> tuple[str, str]:
    if value is None:
        return "", ""

    aware_value = value
    if timezone.is_naive(aware_value):
        aware_value = timezone.make_aware(aware_value, datetime_timezone.utc)

    local_value = timezone.localtime(aware_value, get_xlsx_export_timezone())
    return local_value.strftime("%d.%m.%Y"), local_value.strftime("%H:%M:%S")


def build_xlsx_response(
    *,
    filename: str,
    worksheet_name: str,
    header: Sequence[object],
    rows: Iterable[Sequence[object]],
) -> HttpResponse:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = worksheet_name

    sheet.append(list(header))
    for row in rows:
        sheet.append(list(row))

    response = HttpResponse(content_type=XLSX_CONTENT_TYPE)
    response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
    workbook.save(response)
    return response
