import os
import time

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Apply migrations under a cross-process filesystem lock"

    def handle(self, *args, **options):
        path = os.getenv("MIGRATION_LOCK_FILE", "/app/db/.migration.lock")
        timeout = int(os.getenv("MIGRATION_LOCK_TIMEOUT_SECONDS", "300"))
        stale = int(os.getenv("MIGRATION_LOCK_STALE_SECONDS", "900"))
        started = time.monotonic()
        descriptor = None
        while descriptor is None:
            try:
                if os.path.exists(path) and time.time() - os.path.getmtime(path) > stale:
                    os.unlink(path)
                descriptor = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(descriptor, str(os.getpid()).encode())
            except FileExistsError:
                if time.monotonic() - started >= timeout:
                    raise CommandError("migration_lock_timeout")
                time.sleep(1)
        try:
            call_command("migrate", interactive=False)
        finally:
            os.close(descriptor)
            try:
                os.unlink(path)
            except FileNotFoundError:
                pass
