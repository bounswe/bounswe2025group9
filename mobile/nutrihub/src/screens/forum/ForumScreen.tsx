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
  Alert,
  TextInput
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
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked posts - must match the one in forum.service.ts
const LIKED_POSTS_STORAGE_KEY = 'nutrihub_liked_posts';
const SEARCH_DEBOUNCE_MS = 400;
const FUZZY_SIMILARITY_THRESHOLD = 75;

const levenshteinDistance = (source: string, target: string): number => {
  const lenSource = source.length;
  const lenTarget = target.length;

  if (lenSource === 0) return lenTarget;
  if (lenTarget === 0) return lenSource;

  const matrix = Array.from({ length: lenSource + 1 }, () => new Array(lenTarget + 1).fill(0));

  for (let i = 0; i <= lenSource; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenTarget; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenSource; i++) {
    for (let j = 1; j <= lenTarget; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[lenSource][lenTarget];
};

const simpleRatio = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round(((maxLen - dist) / maxLen) * 100);
};

const partialRatio = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  const lenShort = shorter.length;
  if (lenShort === 0) return 0;

  let highest = 0;
  for (let i = 0; i <= longer.length - lenShort; i++) {
    const window = longer.slice(i, i + lenShort);
    const ratio = simpleRatio(shorter, window);
    if (ratio > highest) highest = ratio;
    if (highest === 100) break;
  }

  return highest;
};

const tokenSortRatio = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const normalize = (str: string) =>
    str
      .split(/\s+/)
      .map(token => token.trim())
      .filter(Boolean)
      .sort()
      .join(' ');
  const normalizedA = normalize(a);
  const normalizedB = normalize(b);
  return simpleRatio(normalizedA, normalizedB);
};

const calculateFuzzySimilarity = (query: string, target: string): number => {
  const source = query.toLowerCase();
  const compared = target.toLowerCase();

  const ratio = simpleRatio(source, compared);
  const partial = partialRatio(source, compared);
  const tokenSort = tokenSortRatio(source, compared);

  return Math.max(ratio, partial, tokenSort);
};

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
  
  // Search related state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ForumTopic[]>([]);
  const [searchResultsCount, setSearchResultsCount] = useState<number>(0);
  const [executedSearchQuery, setExecutedSearchQuery] = useState<string>('');
  const [ingredientMatchMap, setIngredientMatchMap] = useState<Record<number, string[]>>({});
  
  // Use the global posts context
  const { posts, setPosts, updatePost } = usePosts();
  const { user: currentUser } = useAuth();

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

    // If instructed, open a specific user's profile, then clear the flag
    if (route.params?.openUserProfile) {
      const { username, userId } = route.params.openUserProfile;
      navigation.navigate('UserProfile', { username, userId });
      navigation.setParams({ openUserProfile: undefined });
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

  // Handle author press -> navigate to user profile, normalize self-username
  const handleAuthorPress = (post: ForumTopic) => {
    const displayName = currentUser ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() : '';
    const isSelf = !!currentUser && (post.author === currentUser.username || (displayName && post.author === displayName));
    
    console.log('ForumScreen handleAuthorPress:', {
      postAuthor: post.author,
      currentUsername: currentUser?.username,
      displayName,
      isSelf,
      currentUser: currentUser
    });
    
    if (isSelf) {
      console.log('Navigating to MyProfile tab');
      // Navigate to own profile tab instead of UserProfile screen
      navigation.navigate('MyProfile' as any);
    } else {
      console.log('Navigating to UserProfile for:', post.author);
      // Navigate to other user's profile
      navigation.navigate('UserProfile', { username: post.author, userId: post.authorId || undefined });
    }
  };

  // Handle new post creation
  const handleNewPost = () => {
    navigation.navigate('CreatePost');
  };

  // Toggle tag filter - select only one tag or clear if already selected
  const toggleTagFilter = async (tagId: number) => {
    // If loading, don't allow filtering
    if (loading) return;
    
    // Create new selected tags array
    const newSelectedTags = selectedTagIds.includes(tagId) ? [] : [tagId];
    
    // Update state
    setSelectedTagIds(newSelectedTags);
    
    // If we're in search mode, re-apply search with new filter
    if (isSearching && (searchQuery.trim() || executedSearchQuery)) {
      const queryToUse = executedSearchQuery || searchQuery.trim();
      if (queryToUse) {
        runSearch(queryToUse, newSelectedTags);
      } else {
        clearSearch();
      }
    } else {
      // Normal filter behavior - fetch posts with the new filter
      handleFilterChange(newSelectedTags);
    }
  };

  // Find tag by name or ID
  const findTagByName = (name: string): ApiTag | undefined => {
    if (!availableTags || !Array.isArray(availableTags)) {
      console.warn('availableTags is not an array in findTagByName:', availableTags);
      return undefined;
    }
    return availableTags.find(tag => tag && tag.name && tag.name.toLowerCase() === name.toLowerCase());
  };
  
  // Clear search results and return to normal view
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    setSearchResultsCount(0);
    setExecutedSearchQuery('');
    setIngredientMatchMap({});
  }, []);

  const runSearch = useCallback(async (query: string, overrideTagIds?: number[]) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      clearSearch();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setExecutedSearchQuery(normalizedQuery);
    setIngredientMatchMap({});
    
    try {
      const searchPosts = await forumService.searchPosts(normalizedQuery);
      
      const activeTagIds = overrideTagIds ?? selectedTagIds;
      let filteredSearchPosts = searchPosts;
      if (activeTagIds.length > 0) {
        filteredSearchPosts = searchPosts.filter(post => {
          const postTagIds = availableTags
            .filter(tag => post.tags.includes(tag.name))
            .map(tag => tag.id);
          return activeTagIds.some(tagId => postTagIds.includes(tagId));
        });
      }
      
      const mergedSearchPosts = await preserveLikeStatus(filteredSearchPosts, posts);
      setSearchResults(mergedSearchPosts);
      setSearchResultsCount(mergedSearchPosts.length);
    } catch (err) {
      console.error('Error searching for posts:', err);
      setSearchResults([]);
      setSearchResultsCount(0);
    } finally {
      setLoading(false);
    }
  }, [availableTags, clearSearch, preserveLikeStatus, posts, selectedTagIds]);

  // Handle search for posts
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }
    runSearch(searchQuery);
  }, [searchQuery, runSearch, clearSearch]);

  useEffect(() => {
    const normalized = searchQuery.trim();

    if (!normalized) {
      if (isSearching) {
        clearSearch();
      }
      return;
    }

    if (normalized === executedSearchQuery) {
      return;
    }

    const timeoutId = setTimeout(() => {
      runSearch(normalized);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, executedSearchQuery, isSearching, runSearch, clearSearch]);

  useEffect(() => {
    if (!isSearching || !executedSearchQuery) {
      return;
    }

    const normalizedQuery = executedSearchQuery.toLowerCase();
    const postsNeedingMatches = searchResults.filter(
      post => post.hasRecipe !== false && ingredientMatchMap[post.id] === undefined
    );

    postsNeedingMatches.forEach(post => {
      forumService
        .getRecipe(post.id)
        .then(recipe => {
          if (!recipe || !recipe.ingredients) {
            setIngredientMatchMap(prev => ({ ...prev, [post.id]: [] }));
            return;
          }

          const matches = recipe.ingredients
            .map(ingredient => ingredient.food_name || '')
            .filter(name => {
              if (!name) {
                return false;
              }
              const lowerName = name.toLowerCase();
              if (lowerName.includes(normalizedQuery)) {
                return true;
              }
              const similarityScore = calculateFuzzySimilarity(normalizedQuery, lowerName);
              return similarityScore >= FUZZY_SIMILARITY_THRESHOLD;
            });

          setIngredientMatchMap(prev => ({ ...prev, [post.id]: matches }));
        })
        .catch(() => {
          setIngredientMatchMap(prev => ({ ...prev, [post.id]: [] }));
        });
    });
  }, [isSearching, executedSearchQuery, searchResults, ingredientMatchMap]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isSearching && (searchQuery.trim() || executedSearchQuery)) {
        const queryToUse = executedSearchQuery || searchQuery.trim();
        if (queryToUse) {
          await runSearch(queryToUse);
        } else {
          clearSearch();
        }
      } else {
        // Normal refresh
        let fetchedPosts;
        if (selectedTagIds.length > 0) {
          fetchedPosts = await forumService.getPosts(selectedTagIds);
        } else {
          fetchedPosts = await forumService.getPosts();
        }
        
        // Preserve like status during refresh
        const mergedPosts = await preserveLikeStatus(fetchedPosts, posts);
        setPosts(mergedPosts);
      }
    } catch (err) {
      console.error('Error refreshing posts:', err);
      Alert.alert('Error', 'Failed to refresh posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTagIds, setPosts, posts, preserveLikeStatus, isSearching, searchQuery, availableTags, executedSearchQuery, runSearch, clearSearch]);

  // Get current posts to display (search results or regular posts)
  const getCurrentPosts = useCallback((): ForumTopic[] => {
    if (isSearching) {
      return searchResults;
    }
    return posts;
  }, [isSearching, searchResults, posts]);

  // Render forum post
  const renderItem = ({ item }: { item: ForumTopic }) => {
    const matches = ingredientMatchMap[item.id];
    const ingredientMatches =
      isSearching && matches && matches.length > 0 ? matches : undefined;

    return (
      <ForumPost
        post={item}
        onPress={handlePostPress}
        onLike={handlePostLike}
        onComment={handlePostComment}
        onAuthorPress={handleAuthorPress}
        ingredientMatches={ingredientMatches}
      />
    );
  };

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
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, textStyles.heading2]}>Community Forum</Text>
          <Text style={[styles.subtitle, textStyles.caption]}>
            Connect with others, share recipes, and get nutrition advice from our community.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.feedButton}
          onPress={() => navigation.navigate('Feed')}
        >
          <Icon name="rss" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Icon 
            name="magnify" 
            size={20} 
            color={theme.textSecondary} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search posts by title..."
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearch}
        >
          <Text style={[styles.searchButtonText, { color: '#FFFFFF' }]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Status */}
      {isSearching && (
        <View style={[styles.searchStatus, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
          <Text style={[styles.searchStatusText, textStyles.body]}>
            {searchResultsCount > 0 
              ? `Found ${searchResultsCount} result${searchResultsCount !== 1 ? 's' : ''} for "${executedSearchQuery || searchQuery}"${selectedTagIds.length > 0 ? ' in selected category' : ''}` 
              : selectedTagIds.length > 0 
                ? `No results found for "${executedSearchQuery || searchQuery}" in selected category`
                : `No results found for "${executedSearchQuery || searchQuery}"`}
          </Text>
          <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
            <Icon name="close" size={16} color={theme.primary} />
            <Text style={[styles.clearSearchText, { color: theme.primary }]}>Clear search</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
        data={getCurrentPosts()}
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
              {isSearching
                ? `No posts match your search for "${searchQuery}". Try different keywords or clear your search.`
                : selectedTagIds.length > 0
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  feedButton: {
    padding: SPACING.xs,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: 16,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  searchButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  searchStatus: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchStatusText: {
    flex: 1,
    fontSize: 14,
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  clearSearchText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ForumScreen;
