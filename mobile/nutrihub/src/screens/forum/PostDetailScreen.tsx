/**
 * PostDetailScreen
 * 
 * Displays the full content of a forum post with comments.
 */

import React, { useState, useEffect } from 'react';
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
import { ForumTopic, Comment } from '../../types/types';
import { ForumStackParamList } from '../../navigation/types';
import { forumService } from '../../services/api/forum.service';

type PostDetailRouteProp = RouteProp<ForumStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<PostDetailNavigationProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { theme, textStyles } = useTheme();
  
  const postId = route.params.postId;
  const [post, setPost] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Fetch post and comments data
  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch post details
        const postData = await forumService.getPost(postId);
        setPost(postData);
        
        // Fetch comments for the post
        try {
          const commentsData = await forumService.getComments(postId);
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
    };
    
    fetchPostData();
  }, [postId]);
  
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
        setPost(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            commentsCount: (prev.commentsCount || 0) + 1 
          };
        });
        setNewComment('');
      } catch (err) {
        console.error('Error adding comment:', err);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      } finally {
        setSubmittingComment(false);
      }
    }
  };
  
  // Handle comment like - Note: The API doesn't support this yet
  const handleCommentLike = (commentId: number) => {
    // Simulate comment liking until API supports it
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
            }
          : comment
      )
    );
  };
  
  // Render comment item
  const renderComment = (comment: Comment) => (
    <Card key={comment.id} style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthorContainer}>
          <Icon name="account-circle" size={20} color={theme.primary} />
          <Text style={[styles.commentAuthor, textStyles.subtitle]}>{comment.author}</Text>
        </View>
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
          <Text style={[styles.commentLikes, { color: comment.isLiked ? theme.primary : theme.textSecondary }]}>
            {comment.likesCount}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
  
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
            onLike={async (updatedPost) => {
              try {
                const isLiked = await forumService.toggleLike(post.id);
                setPost(prev => prev ? {
                  ...prev,
                  isLiked,
                  likesCount: isLiked 
                    ? (prev.likesCount || 0) + 1 
                    : Math.max((prev.likesCount || 0) - 1, 0) // Ensure count doesn't go below 0
                } : null);
              } catch (err) {
                console.error('Error toggling like:', err);
                Alert.alert('Error', 'Failed to update like status. Please try again.');
              }
            }}
          />
          
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
});

export default PostDetailScreen;