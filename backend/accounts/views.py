from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from .serializers import UserSerializer, LoginSerializer
from .services import register_user, list_users
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from .auth import generate_jwt_token
from django.http import JsonResponse

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


@csrf_exempt  # TODO remove this in production
@api_view(["POST"])
def login_view(request):
    """
    Login with username and password.

    POST /users/login/jwt/
    Payload: { "username": "user", "password": "pass" }

    Response:
    Success: { "token": "jwt_token", "user": {"id": 1, "username": "username"} }
    Error: { "error": "Invalid credentials" }
    """

    # Deserialize and validate input
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        # Authenticate user
        user = authenticate(username=username, password=password)

        if user is None:
            return JsonResponse(
                {
                    "error": "Invalid credentials",
                    "message": "The username or password is incorrect",
                },
                status=401,
            )

        # Generate JWT token
        token = generate_jwt_token(user)

        # Return token and user info
        return JsonResponse(
            {
                "token": token,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
