import os
from crontab import CronTab


def get_crontab_tasks():
    cron = CronTab(user="root")
    command = "python /app/cron_tasks/auto_sync.py"
    job = cron.new(command=command)
    frequency = int(os.environ.get("NOTION_SYNC_PERIOD", 15))
    job.minute.every(frequency)

    # download_command = "python /app/cron_tasks/download_photos.py"
    # download_job = cron.new(command=download_command)
    # download_frequency = int(os.environ.get("PHOTO_SYNC_PERIOD", 5))
    # download_job.minute.every(download_frequency)
    cron.write()


if __name__ == "__main__":
    get_crontab_tasks()
