from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from django.http import FileResponse, Http404
from django.conf import settings
from django.db.models import Q

from .serializers import (
    UserSerializer,
    ChangePasswordSerializer,
    ContactInfoSerializer,
    PhotoSerializer,
    PhotoUploadSerializer,
    AllergenInputSerializer,
    AllergenOutputSerializer,
    TagInputSerializer,
    TagOutputSerializer,
    ReportSerializer,
    UserMetricsSerializer,
    NutritionTargetsSerializer,
)

from .services import register_user, list_users, update_user, delete_user_account
from .models import User, Allergen, Tag, UserTag, Follow
from forum.models import Like, Post, Recipe
from forum.serializers import PostSerializer, RecipeSerializer
import os


class DeleteAccountView(APIView):
    """
    DELETE /users/delete/
    Permanently delete the current user's account.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        reason = request.data.get("reason", "")
        
        try:
            delete_user_account(user, reason=reason)
            return Response(
                {"detail": "Account deleted successfully."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log the error properly in production
            return Response(
                {"detail": f"An error occurred during deletion: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



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
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ContactInfoSerializer(data=request.data)
        if serializer.is_valid():
            user = update_user(request.user, serializer.validated_data)
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED,
            )
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


class PublicUserProfileView(APIView):
    """
    GET /users/@{username}/
    Fetch a user's public profile information by username.
    Authentication is optional - works for both authenticated and anonymous users.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


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
            return Response(
                AllergenOutputSerializer(allergen).data, status=status.HTTP_201_CREATED
            )
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
            return Response(
                {"detail": "Expected a list of allergens."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
                        defaults={"common": allergen_data.get("common", False)},
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
                status=status.HTTP_400_BAD_REQUEST,
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
                # Validate and sanitize tag name
                tag_name = tag_data["name"].strip()

                # Check if name is empty after stripping
                if not tag_name:
                    return Response(
                        {"detail": "Tag name cannot be empty."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check max length (Tag model has max_length=64)
                if len(tag_name) > 64:
                    return Response(
                        {"detail": "Tag name cannot exceed 64 characters."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                tag, _ = Tag.objects.get_or_create(name=tag_name)
            else:
                continue  # skip invalid entries

            tags.append(tag)

        # Clear existing UserTag relationships
        UserTag.objects.filter(user=user).delete()

        # Create new UserTag relationships
        for tag in tags:
            UserTag.objects.create(user=user, tag=tag, verified=False)

        # Serialize response with user context
        response_serializer = TagOutputSerializer(
            tags, many=True, context={"user": user}
        )
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
        if self.request.method == "GET":
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get(self, request):
        user_id = (
            request.query_params.get("user_id") or request.user.id
        )  # Optional user_id param
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = PhotoSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        image = request.FILES.get("profile_image")

        if not image:
            return Response(
                {"detail": "No image file uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Validate file size (max 5 MB)
        max_size = 5 * 1024 * 1024  # 5 MB in bytes
        if image.size > max_size:
            return Response(
                {"detail": "File size exceeds 5 MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Validate file type
        valid_mime_types = ["image/jpeg", "image/png"]
        if image.content_type not in valid_mime_types:
            return Response(
                {"detail": "Only JPG and PNG images are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Save valid image
        upload_serializer = PhotoUploadSerializer(user, data=request.data, partial=True)
        if upload_serializer.is_valid():
            upload_serializer.save()
            # Return the URL using the read serializer
            read_serializer = PhotoSerializer(user)
            return Response(read_serializer.data, status=status.HTTP_200_OK)
        return Response(upload_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user

        if not user.profile_image:
            return Response(
                {"detail": "No profile image to remove."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Get full path to the image file
        image_path = user.profile_image.path

        #  Clear the field and save to DB
        user.profile_image = None
        user.save()

        #  Delete the actual file if it exists
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception as e:
                # Optional: log the error but still return success
                print(f"Error deleting image file: {e}")

        return Response(
            {"detail": "Profile image removed successfully."}, status=status.HTTP_200_OK
        )


class CertificateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        tag_id = request.data.get("tag_id")
        certificate = request.FILES.get("certificate")

        if not tag_id:
            return Response(
                {"detail": "Missing tag_id."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not certificate:
            return Response(
                {"detail": "No certificate file uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure the user has this tag
        try:
            user_tag = UserTag.objects.get(user=user, tag__id=tag_id)
            tag = user_tag.tag
        except UserTag.DoesNotExist:
            return Response(
                {"detail": "Tag not found or not associated with user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        #  Validate file size (max 5 MB)
        max_size = 5 * 1024 * 1024  # 5 MB
        if certificate.size > max_size:
            return Response(
                {"detail": "File size exceeds 5 MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Validate file type
        valid_mime_types = ["image/jpeg", "image/png", "application/pdf"]
        if certificate.content_type not in valid_mime_types:
            return Response(
                {"detail": "Only JPG, PNG, or PDF files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #  Save certificate to UserTag (not Tag)
        user_tag.certificate = certificate
        user_tag.save()

        #  Return updated tag info with user context
        serializer = TagOutputSerializer(tag, context={"user": user})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """
        DELETE /users/certificate/
        Remove certificate from a profession tag.
        Expected body: { "tag_id": <tag_id> }
        """
        user = request.user
        tag_id = request.data.get("tag_id")

        if not tag_id:
            return Response(
                {"detail": "Missing tag_id."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure the user has this tag
        try:
            user_tag = UserTag.objects.get(user=user, tag__id=tag_id)
            tag = user_tag.tag
        except UserTag.DoesNotExist:
            return Response(
                {"detail": "Tag not found or not associated with user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Remove certificate file if it exists
        if user_tag.certificate:
            user_tag.certificate.delete(save=False)
            user_tag.certificate = None
            user_tag.save()

        # Return updated tag info with user context
        serializer = TagOutputSerializer(tag, context={"user": user})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LikedPostsView(APIView):
    """
    GET /users/profile/liked-posts/
    Fetch posts that the current user has liked.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all likes by this user
        liked_post_ids = Like.objects.filter(user=user).values_list(
            "post_id", flat=True
        )

        # Get the posts that were liked
        liked_posts = Post.objects.filter(id__in=liked_post_ids).order_by("-created_at")

        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_posts = paginator.paginate_queryset(liked_posts, request)

        # Serialize the posts
        serializer = PostSerializer(paginated_posts, many=True)

        return paginator.get_paginated_response(serializer.data)


class LikedRecipesView(APIView):
    """
    GET /users/profile/liked-recipes/
    Fetch recipes whose posts the current user has liked.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all post IDs that the user has liked
        liked_post_ids = Like.objects.filter(user=user).values_list(
            "post_id", flat=True
        )

        # Get recipes where the post is in the liked posts
        liked_recipes = Recipe.objects.filter(post_id__in=liked_post_ids).order_by(
            "-created_at"
        )

        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_recipes = paginator.paginate_queryset(liked_recipes, request)

        # Serialize the recipes
        serializer = RecipeSerializer(paginated_recipes, many=True)

        return paginator.get_paginated_response(serializer.data)


class ReportUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReportSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            report = serializer.save()
            return Response(
                {"message": "Report submitted successfully.", "report_id": report.id},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class IsCertificateOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow certificate owners or admin users to view certificates.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Get the token from the URL
        token = view.kwargs.get("token")
        if not token:
            return False

        try:
            # Find the UserTag by certificate token
            user_tag = UserTag.objects.get(certificate_token=token)

            # Allow if user is the owner or an admin
            return (
                request.user == user_tag.user
                or request.user.is_staff
                or request.user.is_superuser
            )
        except UserTag.DoesNotExist:
            return False


class ServeProfileImageView(APIView):
    """
    Serve profile images by token. Public access.
    GET /api/users/profile-image/<uuid:token>/
    """

    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            user = User.objects.get(profile_image_token=token)
        except User.DoesNotExist:
            raise Http404("Profile image not found")

        if not user.profile_image:
            raise Http404("User has no profile image")

        # Build the full path to the file
        file_path = os.path.join(settings.MEDIA_ROOT, user.profile_image.name)

        if not os.path.exists(file_path):
            raise Http404("Profile image file not found")

        # Serve the file with proper content type
        response = FileResponse(open(file_path, "rb"))
        # Let Django auto-detect content type from file extension
        return response


class ServeCertificateView(APIView):
    """
    Serve certificates by token. Restricted to certificate owner or admin.
    GET /api/users/certificate/<uuid:token>/
    Supports both JWT (for API clients) and Session (for Django admin) authentication.
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsCertificateOwnerOrAdmin]

    def get(self, request, token):
        try:
            user_tag = UserTag.objects.get(certificate_token=token)
        except UserTag.DoesNotExist:
            raise Http404("Certificate not found")

        if not user_tag.certificate:
            raise Http404("No certificate file attached")

        # Build the full path to the file
        file_path = os.path.join(settings.MEDIA_ROOT, user_tag.certificate.name)

        if not os.path.exists(file_path):
            raise Http404("Certificate file not found")

        # Serve the file with proper content type
        response = FileResponse(open(file_path, "rb"))
        # Let Django auto-detect content type from file extension
        return response

class FollowUserView(APIView):
    """
    POST /users/follow/
    Body: { "username": "<target_username>" }
    Toggle follow/unfollow operation.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_user = request.user
        target_username = request.data.get("username")

        if not target_username:
            return Response(
                {"detail": "username field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_username == current_user.username:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check target user existence
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check existing follow relation
        existing = Follow.objects.filter(
            follower=current_user, following=target_user
        ).first()

        if existing:
            # UNFOLLOW
            existing.delete()
            return Response(
                {"message": f"You unfollowed {target_user.username}."},
                status=status.HTTP_200_OK,
            )
        else:
            # FOLLOW
            Follow.objects.create(follower=current_user, following=target_user)
            return Response(
                {"message": f"You are now following {target_user.username}."},
                status=status.HTTP_201_CREATED,
            )

class FollowersListView(APIView):
    """
    GET /users/followers/<username>/
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        followers = User.objects.filter(following_set__following=user)
        serializer = UserSerializer(followers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FollowingListView(APIView):
    """
    GET /users/following/<username>/
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        following = User.objects.filter(followers_set__follower=user)
        serializer = UserSerializer(following, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeedView(APIView):
    """
    GET /forum/feed/
    Returns a feed of posts that includes:
    - Posts from users the current user follows
    - Posts the current user has liked
    """
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        # 1. Get IDs of users the current user follows
        following_ids = Follow.objects.filter(follower=user).values_list(
            "following_id", flat=True
        )

        # 2. Get posts the user has liked
        liked_post_ids = Like.objects.filter(user=user).values_list(
            "post_id", flat=True
        )

        # 3. Fetch feed posts: posts by followed users OR liked posts
        posts = (
            Post.objects.filter(
                Q(author_id__in=following_ids) | Q(id__in=liked_post_ids)
            )
            .distinct()
            .order_by("-created_at")
        )

        # 4. Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_posts = paginator.paginate_queryset(posts, request)

        serializer = PostSerializer(paginated_posts, many=True)
        return paginator.get_paginated_response(serializer.data)


class UserMetricsView(APIView):
    """
    GET /api/users/metrics/
    Get user's physical metrics.
    
    POST /api/users/metrics/
    Create or update user's physical metrics.
    Auto-calculates nutrition targets if not custom.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            metrics = request.user.metrics
            serializer = UserMetricsSerializer(metrics)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except:
            return Response(
                {"detail": "User metrics not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        from .models import UserMetrics, NutritionTargets
        
        try:
            # Update existing metrics
            metrics = request.user.metrics
            serializer = UserMetricsSerializer(metrics, data=request.data, partial=True)
        except:
            # Create new metrics
            serializer = UserMetricsSerializer(data=request.data)

        if serializer.is_valid():
            metrics = serializer.save(user=request.user)
            
            # Auto-recalculate targets if not custom
            try:
                targets = request.user.nutrition_targets
                if not targets.is_custom:
                    NutritionTargets.create_from_metrics(metrics)
            except:
                # No targets exist, create them
                NutritionTargets.create_from_metrics(metrics)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NutritionTargetsView(APIView):
    """
    GET /api/users/nutrition-targets/
    Get user's nutrition targets (auto-calculated if not set).
    
    PUT /api/users/nutrition-targets/
    Update custom nutrition targets.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import NutritionTargets
        
        try:
            targets = request.user.nutrition_targets
        except:
            # Try to auto-generate from metrics
            try:
                metrics = request.user.metrics
                targets = NutritionTargets.create_from_metrics(metrics)
            except:
                return Response(
                    {"detail": "No nutrition targets or metrics found. Please set your metrics first."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = NutritionTargetsSerializer(targets)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        from .models import NutritionTargets
        
        try:
            targets = request.user.nutrition_targets
            serializer = NutritionTargetsSerializer(targets, data=request.data, partial=True)
        except:
            serializer = NutritionTargetsSerializer(data=request.data)

        if serializer.is_valid():
            targets = serializer.save(user=request.user, is_custom=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetNutritionTargetsView(APIView):
    """
    POST /api/users/nutrition-targets/reset/
    Reset nutrition targets to auto-calculated values from user metrics.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import NutritionTargets
        
        try:
            metrics = request.user.metrics
        except:
            return Response(
                {"detail": "User metrics not found. Please set your metrics first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        targets = NutritionTargets.create_from_metrics(metrics)
        serializer = NutritionTargetsSerializer(targets)
        
        return Response(serializer.data, status=status.HTTP_200_OK)