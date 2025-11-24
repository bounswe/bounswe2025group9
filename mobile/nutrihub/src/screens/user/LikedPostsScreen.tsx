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
import { forumService } from '../../services/api/forum.service';
import { useFocusEffect } from '@react-navigation/native';

const LikedPostsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [likedPosts, setLikedPosts] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recipe' | 'dietary-tip' | 'meal-plan'>('all');

  // Load user's liked posts on mount
  useEffect(() => {
    loadLikedPosts();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLikedPosts();
    }, [])
  );

  const loadLikedPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const likedPostsData = await forumService.getLikedPosts();
      setLikedPosts(likedPostsData);
    } catch (err: any) {
      console.error('Error loading liked posts:', err);
      const errorMessage = err?.message || 'Failed to load your liked posts';
      setError(errorMessage);
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
      // Use toggleLike to unlike the post (it toggles, so if it's liked, it will unlike)
      await forumService.toggleLike(postId);
      
      // Remove from local state
      setLikedPosts(prev => prev.filter(post => post.id !== postId));
      Alert.alert('Success', 'Post removed from your liked posts');
    } catch (error) {
      console.error('Error unliking post:', error);
      Alert.alert('Error', 'Failed to unlike post. Please try again.');
    }
  };

  const getFilteredPosts = () => {
    if (filter === 'all') return likedPosts;
    
    return likedPosts.filter(post => {
      const tags = post.tags || [];
      switch (filter) {
        case 'recipe':
          return tags.some(tag => tag.toLowerCase() === 'recipe');
        case 'dietary-tip':
          return tags.some(tag => tag.toLowerCase() === 'dietary tip' || tag.toLowerCase() === 'nutrition tip');
        case 'meal-plan':
          return tags.some(tag => tag.toLowerCase() === 'meal plan' || tag.toLowerCase() === 'mealplan');
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

  const renderEmptyState = () => {
    const getEmptyStateMessage = () => {
      switch (filter) {
        case 'recipe':
          return {
            title: 'No Liked Recipes Yet',
            message: 'Recipes you like will appear here. Start exploring the forum to find interesting recipes!'
          };
        case 'dietary-tip':
          return {
            title: 'No Liked Dietary Tips Yet',
            message: 'Dietary tips you like will appear here. Start exploring the forum to find helpful tips!'
          };
        case 'meal-plan':
          return {
            title: 'No Liked Meal Plans Yet',
            message: 'Meal plans you like will appear here. Start exploring the forum to find meal plans!'
          };
        default:
          return {
            title: 'No Liked Posts Yet',
            message: 'Posts you like will appear here. Start exploring the forum to find interesting content!'
          };
      }
    };

    const { title, message } = getEmptyStateMessage();

    return (
      <View style={styles.emptyState}>
        <Icon name="heart-outline" size={64} color={theme.textSecondary} />
        <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
          {title}
        </Text>
        <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
          {message}
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
  };

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
          {renderFilterButton('recipe', 'Recipe', 'chef-hat')}
          {renderFilterButton('dietary-tip', 'Dietary Tip', 'lightbulb')}
          {renderFilterButton('meal-plan', 'Meal Plan', 'calendar-check')}
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
