# Generated migration for seeding default users

import sys
from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_default_users(apps, schema_editor):
    """
    Create default admin and demo users for testing and initial deployment.
    Credentials are documented in README.md for immediate access.
    Skips during tests to avoid interfering with test assertions.
    """
    # Skip during tests
    if "test" in sys.argv or "pytest" in sys.modules:
        return

    User = apps.get_model("accounts", "User")

    # Admin user (superuser with staff privileges)
    if not User.objects.filter(username="admin").exists():
        User.objects.create(
            username="admin",
            email="admin@nutrihub.fit",
            password=make_password("admin123"),
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        print("✓ Created admin user (username: admin, password: admin123)")
    else:
        print("⊘ Admin user already exists")

    # Regular demo user
    if not User.objects.filter(username="demo").exists():
        User.objects.create(
            username="demo",
            email="demo@nutrihub.fit",
            password=make_password("demo123"),
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )
        print("✓ Created demo user (username: demo, password: demo123)")
    else:
        print("⊘ Demo user already exists")


def remove_default_users(apps, schema_editor):
    """
    Reverse migration: remove seeded default users.
    Skips during tests.
    """
    # Skip during tests
    if "test" in sys.argv or "pytest" in sys.modules:
        return

    User = apps.get_model("accounts", "User")

    deleted_count = 0
    for username in ["admin", "demo"]:
        deleted, _ = User.objects.filter(username=username).delete()
        deleted_count += deleted

    print(f"✓ Removed {deleted_count} default users")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0012_accountdeletionlog"),
    ]

    operations = [
        migrations.RunPython(create_default_users, remove_default_users),
    ]
