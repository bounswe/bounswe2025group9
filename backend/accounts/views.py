from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import (UserSerializer, ChangePasswordSerializer, ContactInfoSerializer, PhotoSerializer,
                           AllergenInputSerializer, AllergenOutputSerializer, TagInputSerializer, TagOutputSerializer)
from .services import register_user, list_users, update_user
from .models import User, Allergen, Tag
import os


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
            user = serializer.create(serializer.validated_data)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ContactInfoSerializer(data=request.data)
        if serializer.is_valid():
            user = update_user(request.user, serializer.validated_data)
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


class LogoutView(APIView):
    """
    POST /users/token/logout/
    Body: { "refresh": "<refresh_token>" }
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

class AllergenAddView(APIView):
    # use jwt authentication
    authentication_classes = [JWTAuthentication]
    # require authentication
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        GET /profile/
        Fetch the current user's profile information.
        """
        # current user is available in request.user
        # serialize user data
        serializer = AllergenOutputSerializer(data=request.data)
        if serializer.is_valid():
            allergen = serializer.save()
            return Response(AllergenOutputSerializer(allergen).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class AllergenSetView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        POST /allergens/
        Set or add allergens for the current user.
        Accepts a list of allergens, each with optional id or name/common fields.
        """
        data = request.data
        user = request.user

        if not isinstance(data, list):
            return Response({"detail": "Expected a list of allergens."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AllergenInputSerializer(data=data, many=True)
        if serializer.is_valid():
            allergens = []
            for allergen_data in serializer.validated_data:
                if "id" in allergen_data:
                    # Attach existing allergen by ID
                    try:
                        allergen = Allergen.objects.get(id=allergen_data["id"])
                    except Allergen.DoesNotExist:
                        continue
                elif "name" in allergen_data:
                    # Create new allergen if not exists
                    allergen, _ = Allergen.objects.get_or_create(
                        name=allergen_data["name"],
                        defaults={"common": allergen_data.get("common", False)}
                    )
                else:
                    # Skip invalid entries
                    continue

                allergens.append(allergen)

            # Replace user's allergens
            user.allergens.set(allergens)

            # Return serialized allergens
            response_serializer = AllergenOutputSerializer(allergens, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TagSetView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        user = request.user

        # Expecting a list of tag objects
        if not isinstance(data, list):
            return Response(
                {"detail": "Expected a list of tags."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TagInputSerializer(data=data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tags = []
        for tag_data in serializer.validated_data:
            if "id" in tag_data:
                try:
                    tag = Tag.objects.get(id=tag_data["id"])
                except Tag.DoesNotExist:
                    continue
            elif "name" in tag_data:
                tag, _ = Tag.objects.get_or_create(
                    name=tag_data["name"],
                    defaults={"verified": tag_data.get("verified", False)}
                )
            else:
                continue  # skip invalid entries

            tags.append(tag)

        # Update user's tags
        user.tags.set(tags)

        # Serialize response
        response_serializer = TagOutputSerializer(tags, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    

class GetCommonAllergensView(APIView):
    # use jwt authentication
    authentication_classes = []
    # require authentication
    permission_classes = [AllowAny]

    def get(self, request):
        """
        GET /common-allergens/
        Fetch a list of common allergens.
        """
        common_allergens = Allergen.objects.filter(common=True)
        serializer = AllergenOutputSerializer(common_allergens, many=True)
        return Response(serializer.data)

class ProfileImageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get(self, request):
        user_id = request.query_params.get('user_id') or request.user.id  # Optional user_id param
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PhotoSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        user = request.user
        image = request.FILES.get('profile_image')

        if not image:
            return Response(
                {"detail": "No image file uploaded."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Validate file size (max 5 MB)
        max_size = 5 * 1024 * 1024  # 5 MB in bytes
        if image.size > max_size:
            return Response(
                {"detail": "File size exceeds 5 MB limit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Validate file type
        valid_mime_types = ["image/jpeg", "image/png"]
        if image.content_type not in valid_mime_types:
            return Response(
                {"detail": "Only JPG and PNG images are allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Save valid image
        serializer = PhotoSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        user = request.user

        if not user.profile_image:
            return Response(
                {"detail": "No profile image to remove."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Get full path to the image file
        image_path = user.profile_image.path

        # ✅ Clear the field and save to DB
        user.profile_image = None
        user.save()

        # ✅ Delete the actual file if it exists
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception as e:
                # Optional: log the error but still return success
                print(f"Error deleting image file: {e}")

        return Response(
            {"detail": "Profile image removed successfully."},
            status=status.HTTP_200_OK
        )
