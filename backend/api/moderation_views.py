from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from foods.models import FoodEntry, FoodProposal
from foods.serializers import FoodProposalSerializer
from accounts.models import UserTag, Tag
from accounts.serializers import UserSerializer
from forum.models import Post, Comment
from forum.serializers import PostSerializer, CommentSerializer

User = get_user_model()


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Permission class for moderation endpoints.
    Requires user to be staff or superuser.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)


class FoodProposalModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for moderating food proposals.
    """
    permission_classes = [IsStaffOrAdmin]
    serializer_class = FoodProposalSerializer
    queryset = FoodProposal.objects.all().order_by('-createdAt')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by approval status
        is_approved = self.request.query_params.get('isApproved')
        if is_approved == 'true':
            queryset = queryset.filter(isApproved=True)
        elif is_approved == 'false':
            queryset = queryset.filter(isApproved=False)
        elif is_approved == 'null':
            queryset = queryset.filter(isApproved__isnull=True)
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve or reject a food proposal.
        Uses the same logic as Django admin's save_model.
        """
        proposal = self.get_object()
        approved = request.data.get('approved', True)
        
        # Store old state
        was_approved = proposal.isApproved
        
        # Update approval status
        proposal.isApproved = approved
        proposal.save()
        
        # If newly approved, create FoodEntry (same logic as admin.py)
        if approved and not was_approved:
            entry = FoodEntry.objects.create(
                name=proposal.name,
                category=proposal.category,
                servingSize=proposal.servingSize,
                caloriesPerServing=proposal.caloriesPerServing,
                proteinContent=proposal.proteinContent,
                fatContent=proposal.fatContent,
                carbohydrateContent=proposal.carbohydrateContent,
                dietaryOptions=proposal.dietaryOptions,
                nutritionScore=proposal.nutritionScore,
                imageUrl=proposal.imageUrl,
            )
            entry.allergens.set(proposal.allergens.all())
            
            return Response({
                'message': 'Food proposal approved and added to catalog',
                'proposal': self.get_serializer(proposal).data,
                'entry_id': entry.id
            })
        
        message = 'Food proposal approved' if approved else 'Food proposal rejected'
        return Response({
            'message': message,
            'proposal': self.get_serializer(proposal).data
        })


class UserTagModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for moderating user profession tags and certificates.
    """
    permission_classes = [IsStaffOrAdmin]
    queryset = UserTag.objects.all().order_by('-id')
    
    def get_serializer_class(self):
        # Return a custom serializer with user tag details
        from rest_framework import serializers
        
        class UserTagModerationSerializer(serializers.ModelSerializer):
            user = serializers.SerializerMethodField()
            tag = serializers.SerializerMethodField()
            
            class Meta:
                model = UserTag
                fields = ['id', 'user', 'tag', 'verified', 'certificate']
            
            def get_user(self, obj):
                return {
                    'id': obj.user.id,
                    'username': obj.user.username,
                    'email': obj.user.email,
                }
            
            def get_tag(self, obj):
                return {
                    'id': obj.tag.id,
                    'name': obj.tag.name,
                }
        
        return UserTagModerationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by verification status
        verified = self.request.query_params.get('verified')
        if verified == 'true':
            queryset = queryset.filter(verified=True)
        elif verified == 'false':
            queryset = queryset.filter(verified=False)
        
        # Only show tags with certificates
        has_certificate = self.request.query_params.get('has_certificate', 'true')
        if has_certificate == 'true':
            queryset = queryset.exclude(certificate='')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify or reject a user's profession certificate.
        Uses the same logic as Django admin's actions.
        """
        user_tag = self.get_object()
        approved = request.data.get('approved', True)
        
        user_tag.verified = approved
        user_tag.save()
        
        message = f"Certificate {'approved' if approved else 'rejected'} for {user_tag.user.username}"
        return Response({
            'message': message,
            'user_tag': self.get_serializer(user_tag).data
        })


class ContentModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for moderating posts and comments.
    """
    permission_classes = [IsStaffOrAdmin]
    
    def get_queryset(self):
        if self.action in ['list_posts', 'delete_post']:
            return Post.objects.all().order_by('-created_at')
        return Comment.objects.all().order_by('-created_at')
    
    @action(detail=False, methods=['get'], url_path='posts')
    def list_posts(self, request):
        """List all posts for moderation"""
        posts = Post.objects.all().order_by('-created_at')
        
        # Search filter
        search = request.query_params.get('search')
        if search:
            posts = posts.filter(title__icontains=search) | posts.filter(author__username__icontains=search)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response({
            'count': posts.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['delete'], url_path='posts/(?P<post_id>[^/.]+)')
    def delete_post(self, request, post_id=None):
        """Delete a post (admin action)"""
        try:
            post = Post.objects.get(id=post_id)
            post.delete()
            return Response({
                'message': f'Post "{post.title}" deleted successfully'
            })
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='comments')
    def list_comments(self, request):
        """List all comments for moderation"""
        comments = Comment.objects.all().order_by('-created_at')
        
        # Search filter
        search = request.query_params.get('search')
        if search:
            comments = comments.filter(body__icontains=search) | comments.filter(author__username__icontains=search)
        
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response({
            'count': comments.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['delete'], url_path='comments/(?P<comment_id>[^/.]+)')
    def delete_comment(self, request, comment_id=None):
        """Delete a comment (admin action)"""
        try:
            comment = Comment.objects.get(id=comment_id)
            comment.delete()
            return Response({
                'message': 'Comment deleted successfully'
            })
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Comment not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user moderation.
    """
    permission_classes = [IsStaffOrAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role == 'staff':
            queryset = queryset.filter(is_staff=True)
        elif role == 'users':
            queryset = queryset.filter(is_staff=False)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        elif is_active == 'false':
            queryset = queryset.filter(is_active=False)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                surname__icontains=search
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Suspend or activate a user account.
        
        Request body: { "is_active": true/false, "reason": "..." }
        """
        user = self.get_object()
        is_active = request.data.get('is_active', True)
        reason = request.data.get('reason', '')
        
        user.is_active = is_active
        user.save()
        
        action = 'activated' if is_active else 'suspended'
        message = f"User {user.username} has been {action}"
        if reason:
            message += f". Reason: {reason}"
        
        return Response({
            'message': message,
            'user': self.get_serializer(user).data
        })


class ModerationStatsView(APIView):
    """
    Get moderation statistics.
    
    Endpoint: GET /api/moderation/stats/?range=week|month|all
    """
    permission_classes = [IsStaffOrAdmin]
    
    def get(self, request):
        time_range = request.query_params.get('range', 'week')
        
        # Calculate date range
        if time_range == 'week':
            start_date = timezone.now() - timedelta(days=7)
        elif time_range == 'month':
            start_date = timezone.now() - timedelta(days=30)
        else:
            start_date = None
        
        # Aggregate statistics
        stats = {
            'totalUsers': User.objects.count(),
            'activeUsers': User.objects.filter(is_active=True).count(),
            'newUsersThisWeek': User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'totalPosts': Post.objects.count(),
            'totalComments': Comment.objects.count(),
            
            # Food proposals
            'pendingFoodProposals': FoodProposal.objects.filter(isApproved__isnull=True).count(),
            'approvedFoodProposals': FoodProposal.objects.filter(isApproved=True).count(),
            'rejectedFoodProposals': FoodProposal.objects.filter(isApproved=False).count(),
            
            # Certificates
            'pendingCertificates': UserTag.objects.filter(
                verified=False
            ).exclude(certificate='').count(),
            'verifiedCertificates': UserTag.objects.filter(verified=True).count(),
            
            # Users
            'suspendedUsers': User.objects.filter(is_active=False).count(),
            'staffUsers': User.objects.filter(is_staff=True).count(),
        }
        
        # Time-based stats if range specified
        if start_date:
            stats['newPostsInRange'] = Post.objects.filter(created_at__gte=start_date).count()
            stats['newCommentsInRange'] = Comment.objects.filter(created_at__gte=start_date).count()
        
        return Response(stats)
