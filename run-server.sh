cd ./backend
. ./venv/bin/activate
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses
./manage.py shell < create_user.py
./manage.py runserver localhost:8000
cd ..
