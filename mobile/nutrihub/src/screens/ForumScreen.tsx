import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import ForumTopic from '../components/forum/ForumTopic';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Mock data for forum topics
const FORUM_TOPICS = [
  {
    id: 1,
    title: 'Discussion Topic 1',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User1',
    commentsCount: 5,
    likesCount: 28,
  },
  {
    id: 2,
    title: 'Discussion Topic 2',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User2',
    commentsCount: 15,
    likesCount: 20,
  },
  {
    id: 3,
    title: 'Discussion Topic 3',
    content: 'This is a placeholder for forum post content. The actual implementation will display real posts from the community.',
    author: 'User3',
    commentsCount: 0,
    likesCount: 41,
  },
];

const ForumScreen: React.FC = () => {
  const renderItem = ({ item }: { item: typeof FORUM_TOPICS[0] }) => (
    <ForumTopic
      id={item.id}
      title={item.title}
      content={item.content}
      author={item.author}
      commentsCount={item.commentsCount}
      likesCount={item.likesCount}
      onPress={() => console.log(`Selected forum topic: ${item.id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Forum</Text>
        <Text style={styles.subtitle}>
          This is a placeholder for the Forum page. Implementation will come in the next phase.
        </Text>
      </View>
      
      <FlatList
        data={FORUM_TOPICS}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
      
      <TouchableOpacity style={styles.newPostButton}>
        <Icon name="plus" size={20} color={COLORS.white} />
        <Text style={styles.newPostText}>New Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.heading,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.caption,
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
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 50,
    elevation: 3,
  },
  newPostText: {
    ...FONTS.body,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
});

export default ForumScreen;