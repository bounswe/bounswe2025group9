/**
 * HomeScreen
 * 
 * Main landing screen for the application, displaying key features.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ForumPost from '../components/forum/ForumPost';
import { MainTabParamList, ForumStackParamList } from '../navigation/types';
import { ForumTopic } from '../types/types';
import { forumService } from '../services/api/forum.service';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<ForumStackParamList>
>;

const FEED_PAGE_SIZE = 10;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, textStyles } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [feedPosts, setFeedPosts] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * Fetch feed posts with pagination
   */
  const mergePosts = useCallback((existing: ForumTopic[], incoming: ForumTopic[], append: boolean): ForumTopic[] => {
    const combined = append ? [...existing, ...incoming] : incoming;
    const seen = new Set<number>();
    const unique: ForumTopic[] = [];
    for (const post of combined) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      unique.push(post);
    }
    return unique;
  }, []);

  const fetchFeed = useCallback(async (pageNum: number = 1, append: boolean = false, isRefreshing: boolean = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await forumService.getFeed({ page: pageNum, page_size: FEED_PAGE_SIZE });
      const posts = response.results;
      setFeedPosts(prev => mergePosts(prev, posts, append));
      setHasMore(Boolean(response.next));
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching feed:', err);
      if (!append) {
        setFeedPosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [mergePosts]);

  // Fetch feed on mount
  useEffect(() => {
    if (user) {
      fetchFeed(1, false);
    } else {
      setFeedPosts([]);
    }
  }, [user, fetchFeed]);

  // Refresh feed when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchFeed(1, false);
      }
    }, [user, fetchFeed])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    fetchFeed(1, false, true);
  };

  /**
   * Handle load more posts
   */
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      fetchFeed(nextPage, true);
    }
  };

  /**
   * Handle post like toggle
   */
  const handleLike = async (postId: number) => {
    try {
      const liked = await forumService.toggleLike(postId);
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
    (navigation as any).navigate('PostDetail', { postId });
  };

  /**
   * Navigate to user profile
   */
  const handleAuthorPress = (username: string, userId?: number) => {
    if (user && username === user.username) {
      (navigation as any).navigate('MyProfile');
      return;
    }
    (navigation as any).navigate('UserProfile', { username, userId });
  };


  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <Icon name="rss" size={28} color={theme.primary} />
        <Text style={[styles.feedTitle, textStyles.heading2, { color: theme.text }]}>
          {t('home.yourFeed')}
        </Text>
      </View>
      <TouchableOpacity onPress={handleRefresh} disabled={loading || refreshing}>
        <Icon name="refresh" size={24} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyFeed}>
        <Icon name="rss-off" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, textStyles.heading3, { color: theme.text }]}>
          {t('home.feedEmpty')}
        </Text>
        <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
          {t('home.feedEmptyDesc')}
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, { backgroundColor: theme.primary }]}
          onPress={() => (navigation as any).navigate('Forum')}
        >
          <Text style={[textStyles.buttonText, { color: theme.buttonText }]}>
            {t('home.exploreForum')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render footer (loading more indicator)
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, textStyles.caption, { color: theme.textSecondary }]}>
          {t('home.loadingPosts')}
        </Text>
      </View>
    );
  };

  /**
   * Render post item
   */
  const renderPost = ({ item }: { item: ForumTopic }) => (
    <ForumPost
      post={item}
      onPress={() => handlePostPress(item.id)}
      onLike={() => handleLike(item.id)}
      onAuthorPress={() => handleAuthorPress(item.author, item.authorId)}
    />
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Icon name="account-circle" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, textStyles.heading3, { color: theme.text }]}>
            {t('home.welcome')}
          </Text>
          <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
            {t('home.loginPrompt')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={feedPosts}
        renderItem={renderPost}
        keyExtractor={(item) => `post-${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          feedPosts.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={true}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  feedTitle: {
    fontWeight: '700',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  footerLoading: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default HomeScreen;