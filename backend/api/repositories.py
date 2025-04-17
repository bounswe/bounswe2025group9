from .models import User

"""
User repository module for managing user data, and database interactions.
"""

def get_all_users():
    return User.objects.all()

def create_user(data):
    return User.objects.create(**data)
