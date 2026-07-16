import requests
import sys
import os
import time


if __name__ == "__main__":
    for endpoint in ("volunteer-photo-sync",):
        try:
            response = requests.post(f"http://localhost:8000/feedapi/v1/{endpoint}", timeout=(3, 120))
            response.raise_for_status()
            heartbeat = os.getenv("PHOTO_SYNC_HEARTBEAT_FILE", "/tmp/feed-photo-sync-success")
            with open(heartbeat, "a", encoding="utf-8"):
                os.utime(heartbeat, (time.time(), time.time()))
        except requests.RequestException as exc:
            print(f"cron_failed endpoint={endpoint} category={type(exc).__name__}", file=sys.stderr)
            sys.exit(1)
