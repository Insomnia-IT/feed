#!/bin/sh

cd /app/backend
./manage.py migrate
./manage.py shell < create_user.py
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
./manage.py runserver localhost:8000 &

python ./cron_config.py

/usr/sbin/crond -f -l 8 &

nginx
