import os
from crontab import CronTab


def get_crontab_tasks():
    cron = CronTab(user="root")
    command = "python /app/cron_tasks/auto_sync.py"
    job = cron.new(command=command)
    frequency = int(os.environ.get("NOTION_SYNC_PERIOD", 5))
    job.minute.every(frequency)
    cron.write()


if __name__ == "__main__":
    get_crontab_tasks()
