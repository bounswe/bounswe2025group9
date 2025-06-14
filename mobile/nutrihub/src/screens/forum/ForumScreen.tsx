/**
 * ForumScreen
 * 
 * Displays the community forum with posts and interaction options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ForumPost from '../../components/forum/ForumPost';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ForumTopic } from '../../types/types';
import { ForumStackParamList, SerializedForumPost } from '../../navigation/types';
import { forumService, ApiTag } from '../../services/api/forum.service';
import { usePosts } from '../../context/PostsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked posts - must match the one in forum.service.ts
const LIKED_POSTS_STORAGE_KEY = 'nutrihub_liked_posts';

type ForumScreenNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'ForumList'>;
type ForumScreenRouteProp = RouteProp<ForumStackParamList, 'ForumList'>;

/**
 * Forum screen component displaying community posts
 */
const ForumScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<ForumScreenNavigationProp>();
  const route = useRoute<ForumScreenRouteProp>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<ApiTag[]>([]);
  
  // Use the global posts context
  const { posts, setPosts, updatePost } = usePosts();

  // Helper function to preserve like status when loading new posts
  const preserveLikeStatus = useCallback(async (newPosts: ForumTopic[], currentPosts: ForumTopic[]): Promise<ForumTopic[]> => {
    try {
      // Get liked posts from AsyncStorage
      const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
      const likedPostIds: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
      
      return newPosts.map(newPost => {
        // Check if post is liked in AsyncStorage
        const isLocallyLiked = likedPostIds.includes(newPost.id);
        
        if (isLocallyLiked) {
          return {
            ...newPost,
            isLiked: true,
            likesCount: Math.max(newPost.likesCount, 
              currentPosts.find(p => p.id === newPost.id)?.likesCount || 0)
          };
        }
        
        // Try to find the post in current posts
        const existingPost = currentPosts.find(p => p.id === newPost.id);
        
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
      });
    } catch (error) {
      console.error('Error checking liked posts in AsyncStorage:', error);
      // Fall back to original logic without AsyncStorage if there's an error
      return newPosts.map(newPost => {
        const existingPost = currentPosts.find(p => p.id === newPost.id);
        if (existingPost && existingPost.isLiked !== undefined) {
          return {
            ...newPost,
            isLiked: existingPost.isLiked,
            likesCount: existingPost.isLiked ? 
              Math.max(newPost.likesCount, existingPost.likesCount) : 
              newPost.likesCount
          };
        }
        return newPost;
      });
    }
  }, []);

  // Fetch tags and posts
  useEffect(() => {
    const fetchTagsAndPosts = async () => {
      setLoading(true);
      try {
        // Fetch tags first
        const tags = await forumService.getTags();
        setAvailableTags(tags);
        
        // Then fetch posts directly from the service
        try {
          const fetchedPosts = await forumService.getPosts();
          // Preserve like status from existing posts
          const mergedPosts = await preserveLikeStatus(fetchedPosts, posts);
          setPosts(mergedPosts);
        } catch (err) {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts. Please try again later.');
        }
      } catch (err) {
        setError('Failed to load forum content. Please try again later.');
        console.error('Error fetching forum data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTagsAndPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies to avoid refresh loops

  // Handle new post from navigation params
  useEffect(() => {
    if (route.params?.action === 'addPost' && route.params.postData) {
      const newPost = deserializePost(route.params.postData);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      // Clear the navigation params
      navigation.setParams({ action: undefined, postData: undefined });
    }
  }, [route.params, navigation, setPosts]);

  // Handle filter change manually instead of in useEffect
  const handleFilterChange = useCallback(async (tagIds: number[]) => {
    setLoading(true);
    try {
      const filteredPosts = await forumService.getPosts(tagIds);
      // Preserve like status when applying filters
      const mergedPosts = await preserveLikeStatus(filteredPosts, posts);
      setPosts(mergedPosts);
    } catch (err) {
      console.error('Error fetching filtered posts:', err);
      setError('Failed to filter posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [posts, setPosts, preserveLikeStatus]);

  // Convert serialized post to ForumTopic
  const deserializePost = (serializedPost: SerializedForumPost): ForumTopic => ({
    ...serializedPost,
    createdAt: new Date(serializedPost.createdAt),
    updatedAt: serializedPost.updatedAt ? new Date(serializedPost.updatedAt) : undefined,
  });

  // Handle post press
  const handlePostPress = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Handle post like
  const handlePostLike = async (post: ForumTopic) => {
    try {
      const isLiked = await forumService.toggleLike(post.id);
      
      // Update post in global context
      const updatedPost = {
        ...post,
        isLiked,
        likesCount: isLiked ? post.likesCount + 1 : Math.max(post.likesCount - 1, 0)
      };
      
      updatePost(updatedPost);
      
      // Update in AsyncStorage for persistence across sessions
      try {
        const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
        let likedPosts: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
        
        if (isLiked) {
          // Add post ID if not already in the list
          if (!likedPosts.includes(post.id)) {
            likedPosts.push(post.id);
          }
        } else {
          // Remove post ID from the list
          likedPosts = likedPosts.filter(id => id !== post.id);
        }
        
        await AsyncStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPosts));
      } catch (error) {
        console.error('Error updating liked posts in storage:', error);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Handle post comment
  const handlePostComment = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Handle new post creation
  const handleNewPost = () => {
    navigation.navigate('CreatePost');
  };

  // Toggle tag filter - select only one tag or clear if already selected
  const toggleTagFilter = (tagId: number) => {
    // If loading, don't allow filtering
    if (loading) return;
    
    // Create new selected tags array
    const newSelectedTags = selectedTagIds.includes(tagId) ? [] : [tagId];
    
    // Update state
    setSelectedTagIds(newSelectedTags);
    
    // Fetch posts with the new filter
    handleFilterChange(newSelectedTags);
  };

  // Find tag by name or ID
  const findTagByName = (name: string): ApiTag | undefined => {
    if (!availableTags || !Array.isArray(availableTags)) {
      console.warn('availableTags is not an array in findTagByName:', availableTags);
      return undefined;
    }
    return availableTags.find(tag => tag && tag.name && tag.name.toLowerCase() === name.toLowerCase());
  };
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedPosts;
      if (selectedTagIds.length > 0) {
        fetchedPosts = await forumService.getPosts(selectedTagIds);
      } else {
        fetchedPosts = await forumService.getPosts();
      }
      
      // Preserve like status during refresh
      const mergedPosts = await preserveLikeStatus(fetchedPosts, posts);
      setPosts(mergedPosts);
    } catch (err) {
      console.error('Error refreshing posts:', err);
      Alert.alert('Error', 'Failed to refresh posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTagIds, setPosts, posts, preserveLikeStatus]);

  // Render forum post
  const renderItem = ({ item }: { item: ForumTopic }) => (
    <ForumPost
      post={item}
      onPress={handlePostPress}
      onLike={handlePostLike}
      onComment={handlePostComment}
    />
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, textStyles.heading2]}>Community Forum</Text>
          <Text style={[styles.subtitle, textStyles.caption]}>
            Join discussions about nutrition, recipes, and healthy eating.
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, textStyles.heading2]}>Community Forum</Text>
          <Text style={[styles.subtitle, textStyles.caption]}>
            Join discussions about nutrition, recipes, and healthy eating.
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, textStyles.body]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setError(null);
              handleRefresh();
            }}
          >
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, textStyles.heading2]}>Community Forum</Text>
        <Text style={[styles.subtitle, textStyles.caption]}>
          Connect with others, share recipes, and get nutrition advice from our community.
        </Text>
      </View>
      
      {/* Filter Posts Section */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterHeader}>
          <Icon name="filter-variant" size={18} color={theme.text} />
          <Text style={[styles.filterHeaderText, textStyles.body]}>Filter Posts</Text>
        </View>
        
        <View style={styles.filterOptions}>
          {/* Dietary Tips */}
          <TouchableOpacity
            style={[
              styles.filterOption,
              selectedTagIds.includes(findTagByName('Dietary tip')?.id || -1) && { 
                backgroundColor: theme.primary 
              }
            ]}
            onPress={() => {
              const tag = findTagByName('Dietary tip');
              if (tag && tag.id) toggleTagFilter(tag.id);
            }}
          >
            <Icon
              name="food-apple" 
              size={16}
              color={selectedTagIds.includes(findTagByName('Dietary tip')?.id || -1) ? 
                '#fff' : theme.text}
            />
            <Text
              style={[
                styles.filterOptionText,
                selectedTagIds.includes(findTagByName('Dietary tip')?.id || -1) && {
                  color: '#fff'
                }
              ]}
            >
              Dietary Tips
            </Text>
          </TouchableOpacity>
          
          {/* Recipes */}
          <TouchableOpacity
            style={[
              styles.filterOption,
              selectedTagIds.includes(findTagByName('Recipe')?.id || -1) && { 
                backgroundColor: theme.primary 
              }
            ]}
            onPress={() => {
              const tag = findTagByName('Recipe');
              if (tag && tag.id) toggleTagFilter(tag.id);
            }}
          >
            <Icon
              name="chef-hat" 
              size={16}
              color={selectedTagIds.includes(findTagByName('Recipe')?.id || -1) ? 
                '#fff' : theme.text}
            />
            <Text
              style={[
                styles.filterOptionText,
                selectedTagIds.includes(findTagByName('Recipe')?.id || -1) && {
                  color: '#fff'
                }
              ]}
            >
              Recipes
            </Text>
          </TouchableOpacity>
          
          {/* Meal Plans */}
          <TouchableOpacity
            style={[
              styles.filterOption,
              selectedTagIds.includes(findTagByName('Meal plan')?.id || -1) && { 
                backgroundColor: theme.primary 
              }
            ]}
            onPress={() => {
              const tag = findTagByName('Meal plan');
              if (tag && tag.id) toggleTagFilter(tag.id);
            }}
          >
            <Icon
              name="calendar-text" 
              size={16}
              color={selectedTagIds.includes(findTagByName('Meal plan')?.id || -1) ? 
                '#fff' : theme.text}
            />
            <Text
              style={[
                styles.filterOptionText,
                selectedTagIds.includes(findTagByName('Meal plan')?.id || -1) && {
                  color: '#fff'
                }
              ]}
            >
              Meal Plans
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="forum-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, textStyles.heading4]}>No posts found</Text>
            <Text style={[styles.emptyText, textStyles.body]}>
              {selectedTagIds.length > 0
                ? 'Try adjusting your filters or be the first to post in this category!'
                : 'Be the first to start a discussion!'}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={[styles.newPostButton, { backgroundColor: theme.primary }]}
        onPress={handleNewPost}
      >
        <Icon name="plus" size={20} color="#FFFFFF" />
        <Text style={[styles.newPostText, { color: '#FFFFFF' }]}>New Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 50,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  filterHeaderText: {
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2EA',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  filterOptionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80, // Extra padding at bottom to account for new post button
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  newPostButton: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newPostText: {
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
    fontSize: 16,
  },
});

export default ForumScreen;