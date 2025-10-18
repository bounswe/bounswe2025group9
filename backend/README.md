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
A JSON file named `foods.json` is located under the `db_initialization` folder.

#### Using AI-Generated Food Images

This project uses OpenAI's image generation API to create food images. The images are pre-generated and stored locally, replacing the need for external image sources.

**Setup:**

1. Create a config file from the template:
   ```bash
   cd backend/api/db_initialization
   cp config.py.example config.py
   ```

2. Edit `config.py` and add your OpenAI API credentials:
   - Get your API key from: https://platform.openai.com/api-keys
   - Add your organization ID (optional)

3. Generate food images:
   ```bash
   python backend/api/db_initialization/generate_food_images.py
   ```
   This will:
   - Generate 5 sample images first for review
   - Ask if you want to continue with all images
   - Save images to `food_images/` directory
   - Update `foods.json` with local image URLs

4. (Optional) Convert images to WebP format for better performance:
   ```bash
   python backend/api/db_initialization/convert_to_webp.py
   ```

5. Load the food data into the database:
   ```bash
   python ./backend/api/db_initialization/load_food_data.py
   ```

**Note:** The migration `0004_load_500_common_foods.py` will automatically load food data when you run `python manage.py migrate`.

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
