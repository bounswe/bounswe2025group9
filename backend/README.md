# Quick Setup

EXPERIMENTAL

RUN ONLY `docker-compose up --build -d`

## Development Setup

```bash
python -m venv venv # or use conda
source venv/bin/activate
source setup.sh # loads environment variables

pip install -r requirements-dev.txt # install requirements

pre-commit install # install pre-commit hooks
```

# run following in another terminal process to run DB in docker.

docker-compose up -d

# Migration commands:

python manage.py makemigrations
python manage.py migrate

## Development Server

Run the development server:

```bash
./manage.py runserver 9000
```

# Now we have exposede our API, and our DB is running. We need to populate our DB with common foods. We have already created a JSON file named food.json under db_initialization folder. Before making request don't forget to populate DB.

python .\backend\api\db_initialization\load_food_data.py

## Tests

```bash
./manage.py test
python ./backend/manage.py test api  # this runs tests in terminal and returns which are passed, and what is error if any errors occured.
```

## Contribution Guide

Please format your changes with `black`:

```bash
black .
```

Note: If you setup `pre-commit` hooks, `black format` will automatically run.
