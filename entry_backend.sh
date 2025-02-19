#!/bin/sh

cd /app/backend

python ./cron_config.py

/usr/sbin/crond -f -l 8 &

./manage.py migrate
./manage.py shell < create_user.py
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
./manage.py runserver 0.0.0.0:8000
