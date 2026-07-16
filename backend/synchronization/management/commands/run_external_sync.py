from django.core.management.base import BaseCommand, CommandError

from synchronization.notion import NotionSync
import os
import time


class Command(BaseCommand):
    help = "Run one external synchronization outside the web worker"

    def add_arguments(self, parser):
        parser.add_argument("--all-data", action="store_true")
        parser.add_argument("--trigger", choices=("manual", "cron"), default="manual")
        parser.add_argument("--reservation-token")

    def handle(self, *args, **options):
        try:
            NotionSync(trigger=options["trigger"], reservation_token=options["reservation_token"]).main(all_data=options["all_data"])
        except Exception as exc:
            raise CommandError(f"external_sync_failed:{type(exc).__name__}") from None
        self.stdout.write(self.style.SUCCESS("external_sync_completed"))
        if options["trigger"] == "cron":
            heartbeat = os.getenv("CRON_HEARTBEAT_FILE", "/tmp/feed-cron-success")
            with open(heartbeat, "a", encoding="utf-8"):
                os.utime(heartbeat, (time.time(), time.time()))
