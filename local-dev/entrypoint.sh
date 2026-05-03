#!/bin/bash
set -e

gcc -fPIC -shared /app/icu/icu.c -licui18n -licuuc -licudata -L/usr/local/lib -o /usr/local/lib/libSqliteIcu.so
ln -sf /usr/local/lib/libSqliteIcu.so /app/icu/libSqliteIcu.so

python manage.py migrate
python manage.py shell < ./create_user.py
python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
python -m debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:8000