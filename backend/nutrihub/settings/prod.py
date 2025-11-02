# Production settings for NutriHub Django application

from .base import *

ALLOWED_HOSTS = [
    "nutrihub.fit",
    "www.nutrihub.fit",
]

CSRF_TRUSTED_ORIGINS = [
    "https://nutrihub.fit",
    "https://www.nutrihub.fit",
]

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "test": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    },
}
