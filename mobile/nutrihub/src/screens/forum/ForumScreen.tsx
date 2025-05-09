/**
 * ForumScreen
 * 
 * Displays the community forum with posts and interaction options.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ForumPost from '../../components/forum/ForumPost';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ForumTopic } from '../../types/types';

// Mock data for forum topics
const FORUM_TOPICS: ForumTopic[] = [
  {
    id: 1,
    title: 'Discussion Topic 1',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User1',
    authorId: 101,
    commentsCount: 5,
    likesCount: 28,
    isLiked: false,
    tags: ['Dietary Tip'],
    createdAt: new Date('2025-04-26T10:15:00Z'),
  },
  {
    id: 2,
    title: 'Discussion Topic 2',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User2',
    authorId: 102,
    commentsCount: 15,
    likesCount: 20,
    isLiked: true,
    tags: ['Recipe'],
    createdAt: new Date('2025-04-27T14:20:00Z'),
  },
  {
    id: 3,
    title: 'Discussion Topic 3',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User3',
    authorId: 103,
    commentsCount: 0,
    likesCount: 41,
    isLiked: false,
    tags: ['Meal Plan'],
    createdAt: new Date('2025-04-28T19:45:00Z'),
  },
];

/**
 * Forum screen component displaying community posts
 */
const ForumScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();

  // Handle post press
  const handlePostPress = (post: ForumTopic) => {
    console.log(`Selected post: ${post.id}`);
    // Navigate to post detail screen (to be implemented)
  };

  // Handle post like
  const handlePostLike = (post: ForumTopic) => {
    console.log(`Liked post: ${post.id}`);
    // Toggle like state (to be implemented)
  };

  // Handle post comment
  const handlePostComment = (post: ForumTopic) => {
    console.log(`Comment on post: ${post.id}`);
    // Navigate to comments screen (to be implemented)
  };

  // Handle post share
  const handlePostShare = (post: ForumTopic) => {
    console.log(`Share post: ${post.id}`);
    // Show share options (to be implemented)
  };

  // Handle new post creation
  const handleNewPost = () => {
    console.log('Create new post');
    // Navigate to post creation screen (to be implemented)
  };

  // Render forum post
  const renderItem = ({ item }: { item: ForumTopic }) => (
    <ForumPost
      post={item}
      onPress={handlePostPress}
      onLike={handlePostLike}
      onComment={handlePostComment}
      onShare={handlePostShare}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, textStyles.heading2]}>Community Forum</Text>
        <Text style={[styles.subtitle, textStyles.caption]}>
          Join discussions about nutrition, recipes, and healthy eating.
        </Text>
      </View>
      
      <FlatList
        data={FORUM_TOPICS}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
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
  listContent: {
    padding: SPACING.md,
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
  },
  newPostText: {
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
    fontSize: 16,
  },
});

export default ForumScreen;