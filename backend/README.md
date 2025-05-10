# Quick Setup

## Deployment Setup

Run this and hope for the best:

```bash
docker-compose up --build -d
```

This will expose the app at port `8081`, or whichever port is specified in `docker-compose.yaml`.

## Development Setup

```bash
python -m venv venv  # or use conda
source venv/bin/activate
source setup.sh      # loads environment variables

pip install -r requirements-dev.txt  # install dev requirements

pre-commit install  # install pre-commit hooks
```

Run the following in another terminal to start the database container:

```bash
docker-compose up -d
```

### Migration Commands

```bash
python manage.py makemigrations
python manage.py migrate
```

## Development Server

Run the development server:

```bash
./manage.py runserver 9000
```

## DB Setup

We are using `MySQL` as the database.  
In the development environment, the Django app expects a user defined by the `MYSQL_USER` and `MYSQL_PASSWORD` environment variables with access to the `MYSQL_DATABASE` (defaults to `mydb`).

Note: Django connects to the DB using the `MYSQL_HOST` variable, which should be set to `localhost` for local development.  
In `docker-compose.yaml`, the service name is `db`, so set `MYSQL_HOST=db` for containerized access.

Make sure to source `setup.sh` or manually define these environment variables to establish a successful DB connection.  
Don't forget to apply migrations.

### Food DB

Now that the API is exposed and the DB is running, we need to populate it with common foods.  
A JSON file named `food.json` is located under the `db_initialization` folder.  
Before making requests, populate the DB:

```bash
python ./backend/api/db_initialization/load_food_data.py
```

## Tests

```bash
./manage.py test
python ./backend/manage.py test api  # runs tests and prints results/errors to terminal
```

## Contribution Guide

Please format your changes with `black`:

```bash
black .
```

Note: If you set up `pre-commit` hooks, `black` will run automatically on commits.
