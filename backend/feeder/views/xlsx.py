from __future__ import annotations

from typing import Iterable, Sequence

from django.http import HttpResponse
from openpyxl import Workbook

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


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
