from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import UserSerializer, ChangePasswordSerializer
from .services import register_user, list_users


class UserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /
        Fetch and return a list of all users in the system.
        """
        users = list_users()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class CreateUserView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = register_user(serializer.validated_data)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            user = request.user
            user.set_password(
                serializer.validated_data["new_password"]
            )  # Hashes password internally
            user.save()
            return Response(
                {"detail": "Password changed successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    # use jwt authentication
    authentication_classes = [JWTAuthentication]
    # require authentication
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /profile/
        Fetch the current user's profile information.
        """
        # current user is available in request.user
        user = request.user
        # serialize user data
        serializer = UserSerializer(user)
        return Response(serializer.data)
