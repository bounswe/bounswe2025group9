from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

from .serializers import UserSerializer
from .services import register_user, list_users


@api_view(["GET"])
def get_users(request: Request) -> Response:
    """
    GET /
    Fetch and return a list of all users in the system.
    """
    users = list_users()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)  # Return serialized user data as JSON


@api_view(["POST"])
def create_user_view(request: Request) -> Response:
    """
    POST /create/
    Create a new user using the request payload.
    """
    serializer = UserSerializer(data=request.data)  # Deserialize and validate input
    if serializer.is_valid():
        user = register_user(serializer.validated_data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
