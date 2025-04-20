from .repositories import get_all_users, create_user

"""
Main logic of backend application is generally placed in services layer. 
This layer is responsible for the business logic of the application.
It should not be responsible for any data access logic, so we use repositories layer for that.
Data manipulation, data validation, and data transformation should be done in this layer.
"""


def list_users():
    return get_all_users()


def register_user(validated_data):
    return create_user(validated_data)
