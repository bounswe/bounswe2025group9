from django.http import JsonResponse, HttpRequest
from datetime import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

from .serializers import UserSerializer
from .services import register_user, list_users


def get_time(request: HttpRequest):
    """
    Get the current time.

    GET /time?name={name}

    example:
        {
            "time": "2023-10-01T12:00:00",
            "name": "Arda"
        }
    """
    if request.method == "GET":
        name = request.GET.get("name")
        if name is None:
            return JsonResponse({"error": "name is required"}, status=400)
        return JsonResponse({"time": datetime.now().isoformat(), "name": name})


@api_view(["GET"])
def get_users(request: Request) -> Response:
    """
    GET /users/
    Fetch and return a list of all users in the system.
    """
    users = list_users()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)  # Return serialized user data as JSON


@api_view(["POST"])
def create_user_view(request: Request) -> Response:
    """
    POST /users/
    Create a new user using the request payload.
    """
    serializer = UserSerializer(data=request.data)  # Deserialize and validate input
    if serializer.is_valid():
        user = register_user(serializer.validated_data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
