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
  ScrollView,
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
import FeatureCard from '../components/common/FeatureCard';
import ForumPost from '../components/forum/ForumPost';
import { MainTabParamList, ForumStackParamList } from '../navigation/types';
import { ForumTopic } from '../types/types';
import { forumService } from '../services/api/forum.service';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<ForumStackParamList>
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, textStyles } = useTheme();
  const { user } = useAuth();
  
  const [feedPosts, setFeedPosts] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.name || user.surname) {
      return `${user.name || ''} ${user.surname || ''}`.trim();
    }
    return user.username;
  };

  /**
   * Fetch feed posts
   */
  const fetchFeed = async (isRefreshing: boolean = false) => {
    if (!isRefreshing) {
      setLoading(true);
    }

    try {
      const posts = await forumService.getFeed();
      setFeedPosts(posts.slice(0, 5)); // Show only first 5 posts
    } catch (err) {
      console.error('Error fetching feed:', err);
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


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Hero Section */}
        <Text style={[styles.welcomeTitle, textStyles.heading1]}>
          Welcome{user ? `, ${getUserDisplayName()}` : ''} to NutriHub
        </Text>
        <Text style={[styles.welcomeDescription, textStyles.body]}>
          Your complete nutrition platform for discovering healthy foods, sharing recipes, 
          and joining a community of health enthusiasts.
        </Text>

        {/* Feature Cards Section */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            iconName="food-apple"
            title="Track Nutrition"
            description="Access detailed nutritional information for thousands of foods."
          />
          <FeatureCard
            iconName="notebook"
            title="Share Recipes"
            description="Discover and share healthy recipes with the community."
          />
          <FeatureCard
            iconName="account-group"
            title="Get Support"
            description="Connect with others on your journey to better nutrition."
          />
        </View>

        {/* Feed Section */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={[styles.feedTitle, textStyles.heading2, { color: theme.text }]}>
              Your Feed
            </Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Feed')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.feedLoading}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : feedPosts.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Icon name="rss-off" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                Follow users to see their posts here
              </Text>
              <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: theme.primary }]}
                onPress={() => (navigation as any).navigate('Forum')}
              >
                <Text style={[textStyles.buttonText, { color: theme.buttonText }]}>
                  Explore Forum
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.feedPosts}>
              {feedPosts.map((post) => (
                <ForumPost
                  key={post.id}
                  post={post}
                  onPress={() => handlePostPress(post.id)}
                  onLike={() => handleLike(post.id)}
                  onAuthorPress={() => handleAuthorPress(post.author, post.authorId)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeDescription: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
  },
  feedSection: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedTitle: {
    fontWeight: '600',
  },
  seeAllText: {
    fontWeight: '600',
    fontSize: 14,
  },
  feedLoading: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyFeed: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  feedPosts: {
    width: '100%',
  },
});

export default HomeScreen;