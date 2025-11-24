/**
 * PostDetailScreen
 * 
 * Displays the full content of a forum post with comments.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ForumPost from '../../components/forum/ForumPost';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { ForumTopic, Comment } from '../../types/types';
import { ForumStackParamList } from '../../navigation/types';
import { forumService, RecipeDetail } from '../../services/api/forum.service';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked posts - must match the one in forum.service.ts
const LIKED_POSTS_STORAGE_KEY = 'nutrihub_liked_posts';

type PostDetailRouteProp = RouteProp<ForumStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<PostDetailNavigationProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { theme, textStyles } = useTheme();
  const { posts, updatePost } = usePosts();
  const { user: currentUser } = useAuth();
  
  const postId = route.params.postId;
  const [post, setPost] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  
  // Preserve like status when loading post data
  const preserveLikeStatus = useCallback(async (newPost: ForumTopic, existingPosts: ForumTopic[]): Promise<ForumTopic> => {
    // Try to find the post in existing posts
    const existingPost = existingPosts.find(p => p.id === newPost.id);
    
    // Check if post is in our locally stored liked posts
    try {
      const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
      const likedPosts: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
      const isLocallyLiked = likedPosts.includes(newPost.id);
      
      if (isLocallyLiked) {
        // If the post is in our locally stored liked posts, mark it as liked
        return {
          ...newPost,
          isLiked: true,
          likesCount: Math.max(newPost.likesCount, existingPost?.likesCount || 0)
        };
      }
    } catch (error) {
      console.error('Error checking liked posts storage:', error);
    }
    
    // If it exists and has like status, preserve that information
    if (existingPost && existingPost.isLiked !== undefined) {
      return {
        ...newPost,
        isLiked: existingPost.isLiked,
        likesCount: existingPost.isLiked ? 
          // If it was liked locally but not on server, ensure count is accurate
          Math.max(newPost.likesCount, existingPost.likesCount) : 
          newPost.likesCount
      };
    }
    
    // Otherwise return the new post as is
    return newPost;
  }, []);
  
  // Get post and comments from API - no dependency on context methods
  const fetchPostData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to get the post from our posts array
      let postData = posts.find(p => p.id === postId);
      
      // If not found in array, fetch from API
      if (!postData) {
        try {
          const fetchedPost = await forumService.getPost(postId);
          // Preserve any existing like status
          postData = await preserveLikeStatus(fetchedPost, posts);
        } catch (err) {
          console.error('Error fetching post from API:', err);
          throw err;
        }
      }
      
      setPost(postData);
      
      // Check if this is a recipe post
      const isRecipePost = postData.tags.some(tag => 
        tag.toLowerCase().includes('recipe')
      );
      
      // Fetch recipe details if it's a recipe post
      if (isRecipePost) {
        setLoadingRecipe(true);
        try {
          const recipeData = await forumService.getRecipe(postId);
          setRecipe(recipeData);
        } catch (err) {
          console.error('Error fetching recipe details:', err);
          // Don't set an error - just show the post without recipe details
        } finally {
          setLoadingRecipe(false);
        }
      }
      
      // Fetch comments for the post
      try {
        const commentsData = await forumService.getComments(postId);
        if (__DEV__) {
          console.log('📥 Fetched comments:', {
            count: commentsData.length,
            comments: commentsData.map(c => ({
              id: c.id,
              author: c.author,
              hasProfileImage: !!c.authorProfileImage,
              profileImageUrl: c.authorProfileImage,
            })),
          });
        }
        setComments(commentsData);
      } catch (err) {
        console.error('Error fetching comments:', err);
        // Don't set an error just for comments - we can still show the post
      }
    } catch (err) {
      console.error('Error fetching post data:', err);
      setError('Failed to load post. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, posts, preserveLikeStatus]);
  
  // Fetch post and comments data
  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);
  
  // Format date to a human-readable string
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  // Handle adding a new comment
  const handleAddComment = async () => {
    if (newComment.trim() && post) {
      setSubmittingComment(true);
      
      try {
        // Submit comment to API
        const createdComment = await forumService.createComment({
          post: post.id,
          body: newComment.trim()
        });
        
        // Add comment to list and update post comment count
        setComments(prevComments => [...prevComments, createdComment]);
        
        // Update post in both local state and global context
        const updatedPost = {
          ...post,
          commentsCount: (post.commentsCount || 0) + 1
        };
        
        setPost(updatedPost);
        updatePost(updatedPost); // Update in global context
        
        setNewComment('');
      } catch (err) {
        console.error('Error adding comment:', err);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      } finally {
        setSubmittingComment(false);
      }
    }
  };
  
  // Handle comment like
  const handleCommentLike = async (commentId: number) => {
    try {
      const isLiked = await forumService.toggleCommentLike(commentId);
      
      // Update comment in the state with the new like status
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: isLiked,
                likesCount: isLiked 
                  ? (comment.likesCount || 0) + 1 
                  : Math.max((comment.likesCount || 0) - 1, 0) // Ensure count doesn't go below 0
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Error toggling comment like:', err);
      // Optionally alert the user
      Alert.alert('Error', 'Failed to update comment like status.');
    }
  };
  
  // Handle post like
  const handlePostLike = async (postToLike: ForumTopic) => {
    try {
      const isLiked = await forumService.toggleLike(postToLike.id);
      
      // Create an updated post with the new like status
      const updatedPost = {
        ...postToLike,
        isLiked: isLiked,
        likesCount: isLiked 
          ? (postToLike.likesCount || 0) + 1 
          : Math.max((postToLike.likesCount || 0) - 1, 0)
      };
      
      // Update post in local state
      setPost(updatedPost);
      
      // Update post in global context
      updatePost(updatedPost);
      
      // Also update AsyncStorage for persistence across sessions
      try {
        const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
        let likedPosts: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
        
        if (isLiked) {
          // Add post ID if not already in the list
          if (!likedPosts.includes(postToLike.id)) {
            likedPosts.push(postToLike.id);
          }
        } else {
          // Remove post ID from the list
          likedPosts = likedPosts.filter(id => id !== postToLike.id);
        }
        
        await AsyncStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPosts));
      } catch (error) {
        console.error('Error updating liked posts in storage:', error);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };
  
  // Render comment item
  const renderComment = (comment: Comment) => {
    if (__DEV__) {
      console.log('💬 Comment render:', {
        commentId: comment.id,
        author: comment.author,
        hasProfileImage: !!comment.authorProfileImage,
        profileImageUrl: comment.authorProfileImage ? comment.authorProfileImage.substring(0, 50) + '...' : null,
        fullComment: comment,
      });
    }
    
    return (
      <Card key={comment.id} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            style={styles.commentAuthorContainer}
            onPress={() => {
              const displayName = currentUser ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() : '';
              const isSelf = !!currentUser && (comment.author === currentUser.username || (displayName && comment.author === displayName));
              
              if (isSelf) {
                // Navigate to own profile tab instead of UserProfile screen
                navigation.navigate('MyProfile' as any);
              } else {
                // Navigate to other user's profile
                navigation.navigate('UserProfile', { username: comment.author, userId: (comment as any).authorId || undefined });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`View ${comment.author}'s profile`}
          >
            <Avatar 
              uri={comment.authorProfileImage} 
              size={20}
            />
            <Text style={[styles.commentAuthor, textStyles.subtitle]}>{comment.author}</Text>
          </TouchableOpacity>
          <Text style={[styles.commentDate, textStyles.small]}>{formatDate(comment.createdAt)}</Text>
        </View>
      <Text style={[styles.commentContent, textStyles.body]}>{comment.content}</Text>
      <View style={styles.commentFooter}>
        <TouchableOpacity 
          style={styles.commentLikeButton}
          onPress={() => handleCommentLike(comment.id)}
        >
          <Icon 
            name={comment.isLiked ? "thumb-up" : "thumb-up-outline"} 
            size={16} 
            color={comment.isLiked ? theme.primary : theme.textSecondary} 
          />
          <Text style={[
            styles.commentLikes, 
            { color: comment.isLiked ? theme.primary : theme.textSecondary }
          ]}>
            {comment.likesCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Post Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, textStyles.heading4]}>
            {error || 'Post not found'}
          </Text>
          <Text style={[styles.errorSubtext, textStyles.body]}>
            This post may have been deleted or is no longer available.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Post */}
          <ForumPost
            post={post}
            preview={false}
            showTags={true}
            onLike={handlePostLike}
            onAuthorPress={() => {
              const displayName = currentUser ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() : '';
              const isSelf = !!currentUser && (post.author === currentUser.username || (displayName && post.author === displayName));
              
              if (isSelf) {
                // Navigate to own profile tab instead of UserProfile screen
                navigation.navigate('MyProfile' as any);
              } else {
                // Navigate to other user's profile
                navigation.navigate('UserProfile', { username: post.author, userId: post.authorId || undefined });
              }
            }}
          />
          
          {/* Recipe Details Section */}
          {loadingRecipe && (
            <Card style={styles.recipeCard}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, textStyles.body]}>Loading recipe details...</Text>
            </Card>
          )}
          
          {recipe && (
            <Card style={styles.recipeCard}>
              <Text style={[styles.recipeTitle, textStyles.heading3]}>Recipe Details</Text>
              
              {/* Nutritional Summary */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <View style={[styles.nutritionSummary, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Icon name="fire" size={20} color="#EF4444" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {Math.round(recipe.total_calories)}
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="weight-lifter" size={20} color="#3B82F6" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {Math.round(recipe.total_protein)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="water" size={20} color="#F59E0B" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {Math.round(recipe.total_fat)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Fat</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="grain" size={20} color="#10B981" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {Math.round(recipe.total_carbohydrates)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Carbs</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Ingredients */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, textStyles.heading4]}>Ingredients</Text>
                  {recipe.ingredients.map((ingredient, index) => (
                    <View key={index} style={[styles.ingredientItem, { backgroundColor: theme.surfaceVariant }]}>
                      <Text style={[styles.ingredientName, textStyles.body]}>
                        {ingredient.food_name} - {ingredient.amount}g
                      </Text>
                      <Text style={[styles.ingredientNutrition, textStyles.caption]}>
                        ({ingredient.protein?.toFixed(1)}g protein, {ingredient.fat?.toFixed(1)}g fat, {ingredient.carbs?.toFixed(1)}g carbs)
                      </Text>
                    </View>
                  ))}
                </>
              )}
              
              {/* Instructions */}
              {recipe.instructions && (
                <>
                  <Text style={[styles.sectionTitle, textStyles.heading4]}>Instructions</Text>
                  <Text style={[styles.instructions, textStyles.body]}>{recipe.instructions}</Text>
                </>
              )}
            </Card>
          )}
          
          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, textStyles.heading4]}>
              Comments ({comments.length})
            </Text>
            
            {comments.map(renderComment)}
            
            {comments.length === 0 && (
              <Text style={[styles.noCommentsText, textStyles.body]}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          </View>
        </ScrollView>
        
        {/* Comment Input */}
        <View style={[styles.commentInputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            containerStyle={styles.commentInput}
            editable={!submittingComment}
          />
          <Button
            title="Submit"
            onPress={handleAddComment}
            variant="primary"
            size="small"
            disabled={!newComment.trim() || submittingComment}
            loading={submittingComment}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  errorButton: {
    minWidth: 150,
  },
  commentsSection: {
    padding: SPACING.md,
  },
  commentsTitle: {
    marginBottom: SPACING.md,
  },
  commentCard: {
    marginBottom: SPACING.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthor: {
    marginLeft: SPACING.xs,
  },
  commentDate: {},
  commentContent: {
    marginBottom: SPACING.sm,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikes: {
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  noCommentsText: {
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    marginRight: SPACING.md,
    marginBottom: 0,
  },
  recipeCard: {
    margin: SPACING.md,
    marginTop: 0,
  },
  recipeTitle: {
    marginBottom: SPACING.md,
  },
  nutritionSummary: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: SPACING.xs,
  },
  nutritionLabel: {
    marginTop: 2,
    opacity: 0.7,
  },
  sectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  ingredientItem: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  ingredientName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  ingredientNutrition: {
    opacity: 0.7,
  },
  instructions: {
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
});

export default PostDetailScreen;