#!/bin/sh
set -e

python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

exec "$@"
