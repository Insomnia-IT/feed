#!/bin/sh

cd /app/backend

if [ "$DISABLE_CRON" != "True" ]; then
    python ./cron_config.py
    /usr/sbin/crond -f -l 8 &
fi

./manage.py migrate_locked
if [ "$CREATE_INITIAL_USER" = "True" ]; then
    ./manage.py shell < create_user.py
fi
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 --workers "${GUNICORN_WORKERS:-1}" --threads "${GUNICORN_THREADS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" --graceful-timeout "${GUNICORN_GRACEFUL_TIMEOUT:-30}" \
    --access-logfile - --error-logfile - --capture-output
