import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ForumTopic } from '../../types/types';
import ForumPost from '../../components/forum/ForumPost';

const LikedPostsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [likedPosts, setLikedPosts] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recipes' | 'tips' | 'questions'>('all');

  // Load user's liked posts on mount
  useEffect(() => {
    loadLikedPosts();
  }, []);

  const loadLikedPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const likedPostsData = await forumService.getLikedPosts();
      // setLikedPosts(likedPostsData);
      
      // Mock data for now
      const mockLikedPosts: ForumTopic[] = [
        {
          id: 1,
          title: 'Amazing Healthy Breakfast Ideas',
          content: 'Here are some fantastic healthy breakfast recipes that will start your day right. These recipes are packed with nutrients and are easy to make...',
          author: 'nutrition_expert',
          authorId: 1,
          commentsCount: 15,
          likesCount: 42,
          isLiked: true,
          tags: ['recipe', 'breakfast', 'healthy'],
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 2,
          title: 'Nutrition Tips for Beginners',
          content: 'Starting your nutrition journey? Here are some essential tips to help you get started on the right track...',
          author: 'health_coach',
          authorId: 2,
          commentsCount: 8,
          likesCount: 25,
          isLiked: true,
          tags: ['nutrition', 'tips', 'beginner'],
          createdAt: new Date('2024-01-10T14:30:00Z'),
        },
        {
          id: 3,
          title: 'Best Protein Sources for Vegetarians',
          content: 'Looking for plant-based protein options? Here are some excellent sources of protein for vegetarians...',
          author: 'veggie_chef',
          authorId: 3,
          commentsCount: 12,
          likesCount: 38,
          isLiked: true,
          tags: ['protein', 'vegetarian', 'nutrition'],
          createdAt: new Date('2024-01-08T09:15:00Z'),
        },
        {
          id: 4,
          title: 'How to Meal Prep Like a Pro',
          content: 'Meal prepping can save you time and help you stick to your nutrition goals. Here are some pro tips...',
          author: 'meal_prep_master',
          authorId: 4,
          commentsCount: 20,
          likesCount: 67,
          isLiked: true,
          tags: ['meal-prep', 'tips', 'organization'],
          createdAt: new Date('2024-01-05T16:45:00Z'),
        }
      ];
      
      setLikedPosts(mockLikedPosts);
    } catch (err) {
      console.error('Error loading liked posts:', err);
      setError('Failed to load your liked posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewPost = (post: ForumTopic) => {
    // TODO: Navigate to post detail
    Alert.alert('View Post', `Navigate to post: ${post.title}`);
  };

  const handleUnlikePost = async (postId: number) => {
    try {
      // TODO: Replace with actual API call
      // await forumService.unlikePost(postId);
      
      setLikedPosts(prev => prev.filter(post => post.id !== postId));
      Alert.alert('Success', 'Post removed from your liked posts');
    } catch (error) {
      Alert.alert('Error', 'Failed to unlike post. Please try again.');
    }
  };

  const getFilteredPosts = () => {
    if (filter === 'all') return likedPosts;
    
    return likedPosts.filter(post => {
      const tags = post.tags || [];
      switch (filter) {
        case 'recipes':
          return tags.some(tag => tag.toLowerCase().includes('recipe'));
        case 'tips':
          return tags.some(tag => tag.toLowerCase().includes('tip'));
        case 'questions':
          return tags.some(tag => tag.toLowerCase().includes('question'));
        default:
          return true;
      }
    });
  };

  const renderFilterButton = (filterType: typeof filter, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === filterType ? theme.primary : theme.surface,
          borderColor: filter === filterType ? theme.primary : theme.border,
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Icon name={icon as any} size={16} color={filter === filterType ? '#fff' : theme.text} />
      <Text style={[
        textStyles.caption,
        { color: filter === filterType ? '#fff' : theme.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: ForumTopic }) => (
    <View style={styles.postContainer}>
      <ForumPost
        post={item}
        onPress={() => handleViewPost(item)}
        onLike={() => handleUnlikePost(item.id)}
        showLikeButton={true}
        likeButtonText="Unlike"
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="heart-outline" size={64} color={theme.textSecondary} />
      <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
        No Liked Posts Yet
      </Text>
      <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
        Posts you like will appear here. Start exploring the forum to find interesting content!
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Forum' as never)}
      >
        <Icon name="forum" size={20} color="#fff" />
        <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
          Explore Forum
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading your liked posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
            Error Loading Posts
          </Text>
          <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadLikedPosts}
          >
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Liked Posts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Buttons */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
          {renderFilterButton('all', 'All', 'format-list-bulleted')}
          {renderFilterButton('recipes', 'Recipes', 'chef-hat')}
          {renderFilterButton('tips', 'Tips', 'lightbulb')}
          {renderFilterButton('questions', 'Questions', 'help-circle')}
        </ScrollView>
      </View>

      {/* Posts List */}
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterButtons: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  postContainer: {
    marginBottom: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
});

export default LikedPostsScreen;
