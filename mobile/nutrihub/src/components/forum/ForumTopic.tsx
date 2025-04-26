
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface ForumTopicProps {
  id: number;
  title: string;
  content: string;
  author: string;
  commentsCount: number;
  likesCount: number;
  onPress?: () => void;
}

const ForumTopic: React.FC<ForumTopicProps> = ({
  title,
  content,
  author,
  commentsCount,
  likesCount,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Icon name="message-text" size={16} color={COLORS.accent} style={styles.titleIcon} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.topicContent}>{content}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.authorContainer}>
            <Icon name="account" size={14} color={COLORS.lightGray} />
            <Text style={styles.metaText}>Posted by: {author}</Text>
          </View>
          <View style={styles.statsContainer}>
            <Icon name="comment-outline" size={14} color={COLORS.lightGray} />
            <Text style={styles.metaText}> Comments: {commentsCount}</Text>
            <Icon name="thumb-up-outline" size={14} color={COLORS.lightGray} style={styles.likeIcon} />
            <Text style={styles.metaText}> Likes: {likesCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  content: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  titleIcon: {
    marginRight: SPACING.xs,
  },
  title: {
    ...FONTS.subheading,
    flex: 1,
  },
  topicContent: {
    ...FONTS.caption,
    marginBottom: SPACING.md,
    color: COLORS.lightGray,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    marginLeft: SPACING.sm,
  },
  metaText: {
    ...FONTS.caption,
    fontSize: 12,
    marginLeft: 4,
  },
});

export default ForumTopic;