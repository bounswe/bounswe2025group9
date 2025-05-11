/**
 * ForumScreen
 * 
 * Displays the community forum with posts and interaction options.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ForumPost from '../../components/forum/ForumPost';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ForumTopic } from '../../types/types';
import { ForumStackParamList, SerializedForumPost } from '../../navigation/types';

type ForumScreenNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'ForumList'>;
type ForumScreenRouteProp = RouteProp<ForumStackParamList, 'ForumList'>;

// Mock data for forum topics
const INITIAL_FORUM_TOPICS: ForumTopic[] = [
  {
    id: 1,
    title: 'Best vegetarian alternatives for meat?',
    content: 'I\'ve been trying to cut down on meat consumption. What are your favorite plant-based alternatives that actually taste good? I\'ve tried tofu and tempeh, but I\'m looking for more options that have good texture and can absorb flavors well. Any recommendations for brands or preparation methods would be greatly appreciated!',
    author: 'healthyeater22',
    authorId: 101,
    commentsCount: 3,
    likesCount: 24,
    isLiked: false,
    tags: ['Nutrition Tip'],
    createdAt: new Date('2023-10-15T11:30:00Z'),
  },
  {
    id: 2,
    title: 'Quick & Healthy Breakfast Smoothie',
    content: 'Here\'s my go-to morning smoothie recipe that keeps me full until lunch!\n\nIngredients:\n- 1 banana\n- 1 cup spinach\n- 1/2 cup Greek yogurt\n- 1 tbsp almond butter\n- 1 cup almond milk\n- 1 tbsp chia seeds\n\nInstructions:\n1. Add all ingredients to a blender\n2. Blend until smooth\n3. Enjoy immediately!\n\nThis gives you about 15g of protein and tons of nutrients. What are your favorite smoothie combinations?',
    author: 'smoothielover',
    authorId: 102,
    commentsCount: 8,
    likesCount: 45,
    isLiked: true,
    tags: ['Recipe'],
    createdAt: new Date('2023-10-14T08:15:00Z'),
  },
  {
    id: 3,
    title: 'Hidden sources of added sugar',
    content: 'Did you know that many "healthy" foods contain hidden sugars? Here are some surprising sources:\n\n• Granola bars (up to 12g per bar!)\n• Flavored yogurt\n• Instant oatmeal\n• Salad dressings\n• Pasta sauces\n\nAlways check the nutrition labels and look for terms like "evaporated cane juice," "brown rice syrup," or anything ending in "-ose". What other hidden sugar sources have you discovered?',
    author: 'nutritionnerd',
    authorId: 103,
    commentsCount: 12,
    likesCount: 67,
    isLiked: false,
    tags: ['Nutrition Tip'],
    createdAt: new Date('2023-10-13T15:45:00Z'),
  },
];

// Convert serialized post to ForumTopic
const deserializePost = (serializedPost: SerializedForumPost): ForumTopic => ({
  ...serializedPost,
  createdAt: new Date(serializedPost.createdAt),
  updatedAt: serializedPost.updatedAt ? new Date(serializedPost.updatedAt) : undefined,
});

/**
 * Forum screen component displaying community posts
 */
const ForumScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<ForumScreenNavigationProp>();
  const route = useRoute<ForumScreenRouteProp>();
  const [posts, setPosts] = useState<ForumTopic[]>(INITIAL_FORUM_TOPICS);

  // Handle new post from navigation params
  useEffect(() => {
    if (route.params?.action === 'addPost' && route.params.postData) {
      const newPost = deserializePost(route.params.postData);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      // Clear the navigation params
      navigation.setParams({ action: undefined, postData: undefined });
    }
  }, [route.params, navigation]);

  // Handle post press
  const handlePostPress = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Handle post like
  const handlePostLike = (updatedPost: ForumTopic) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  // Handle post comment
  const handlePostComment = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Handle new post creation
  const handleNewPost = () => {
    navigation.navigate('CreatePost');
  };

  // Render forum post
  const renderItem = ({ item }: { item: ForumTopic }) => (
    <ForumPost
      post={item}
      onPress={handlePostPress}
      onLike={handlePostLike}
      onComment={handlePostComment}
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
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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