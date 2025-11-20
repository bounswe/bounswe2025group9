/**
 * FeedScreen
 * 
 * Displays a personalized feed of posts from followed users and liked posts.
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ForumPost from '../../components/forum/ForumPost';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ForumTopic } from '../../types/types';
import { ForumStackParamList } from '../../navigation/types';
import { forumService } from '../../services/api/forum.service';
import { useAuth } from '../../context/AuthContext';

type FeedScreenNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'Feed'>;

/**
 * Feed screen component displaying personalized posts
 */
const FeedScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<ForumTopic[]>([]);
  const { user: currentUser } = useAuth();

  /**
   * Fetch feed posts from API
   */
  const fetchFeed = async (isRefreshing: boolean = false) => {
    if (!isRefreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      const posts = await forumService.getFeed();
      setFeedPosts(posts);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load your feed. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch feed on mount
  useEffect(() => {
    fetchFeed();
  }, []);

  // Refresh feed when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed(true);
  };

  /**
   * Handle post like toggle
   */
  const handleLike = async (postId: number) => {
    try {
      const liked = await forumService.toggleLike(postId);
      
      // Update the post in the list
      setFeedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: liked,
                likesCount: liked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  /**
   * Navigate to post detail
   */
  const handlePostPress = (postId: number) => {
    navigation.navigate('PostDetail', { postId });
  };

  /**
   * Navigate to user profile
   */
  const handleAuthorPress = (username: string, userId?: number) => {
    if (currentUser && username === currentUser.username) {
      // Navigate to user's own profile (main tab)
      return;
    }
    navigation.navigate('UserProfile', { username, userId });
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="rss-off" size={64} color={theme.textSecondary} />
      <Text style={[textStyles.h3, styles.emptyTitle, { color: theme.text }]}>
        Your Feed is Empty
      </Text>
      <Text style={[textStyles.body, styles.emptyText, { color: theme.textSecondary }]}>
        Follow other users to see their posts in your feed, or like posts to see similar content.
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('ForumList')}
      >
        <Text style={[textStyles.buttonText, { color: theme.buttonText }]}>
          Explore Forum
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={64} color={theme.error} />
      <Text style={[textStyles.h3, styles.errorTitle, { color: theme.text }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => fetchFeed()}
      >
        <Text style={[textStyles.buttonText, { color: theme.buttonText }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render loading state
   */
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[textStyles.h2, styles.headerTitle, { color: theme.text }]}>
            My Feed
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Main render
   */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h2, styles.headerTitle, { color: theme.text }]}>
          My Feed
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {error ? (
        renderError()
      ) : (
        /* Feed List */
        <FlatList
          data={feedPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ForumPost
              post={item}
              onPress={() => handlePostPress(item.id)}
              onLike={() => handleLike(item.id)}
              onAuthorPress={() => handleAuthorPress(item.author, item.authorId)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            feedPosts.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  refreshButton: {
    padding: SPACING.xs,
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
});

export default FeedScreen;

