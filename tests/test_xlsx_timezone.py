from datetime import datetime, timezone
from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from feeder.views.xlsx import format_xlsx_datetime


def test_format_xlsx_datetime_exports_portal_timezone():
    date_value, time_value = format_xlsx_datetime(datetime(2026, 5, 16, 9, 30, 15, tzinfo=timezone.utc))

    assert date_value == "16.05.2026"
    assert time_value == "12:30:15"


def test_format_xlsx_datetime_treats_naive_values_as_utc():
    date_value, time_value = format_xlsx_datetime(datetime(2026, 5, 16, 9, 30, 15))

    assert date_value == "16.05.2026"
    assert time_value == "12:30:15"
