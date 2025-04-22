from .models import User

"""
User repository module for managing user data, and database interactions.
Repositories are responsible for data access logic and should not contain any business logic. They can be used by different services.
This module provides functions to interact with the User model, such as fetching all users and creating a new user.
"""


def get_all_users():
    return User.objects.all()


def create_user(data):
    return User.objects.create(**data)
