# Quick Setup

## Development Setup
```bash
python -m venv venv # or use conda
source venv/bin/activate
source setup.sh # loads environment variables

pip install -r requirements-dev.txt # install requirements

pre-commit install # install pre-commit hooks
```

## Development Server
Run the development server:
```bash
./manage.py runserver 9000
```

## Tests
```bash
./manage.py test
```

## Contribution Guide

Please format your changes with `black`:

```bash
black .
```

Note: If you setup `pre-commit` hooks, `black format` will automatically run. 



