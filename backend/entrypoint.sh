#!/bin/sh
set -e

python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate
python api/db_initialization/load_food_data.py

exec "$@"
