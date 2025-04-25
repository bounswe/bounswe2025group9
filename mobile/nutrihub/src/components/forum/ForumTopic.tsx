import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING } from '../../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createFontStyles } from '../../constants/theme';

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
  const { colors } = useTheme();
  const fonts = createFontStyles(colors);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Icon name="message-text" size={16} color={colors.accent} style={styles.titleIcon} />
          <Text style={[styles.title, fonts.subheading]}>{title}</Text>
        </View>
        <Text style={[styles.topicContent, fonts.caption]}>{content}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.authorContainer}>
            <Icon name="account" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Posted by: {author}</Text>
          </View>
          <View style={styles.statsContainer}>
            <Icon name="comment-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}> Comments: {commentsCount}</Text>
            <Icon name="thumb-up-outline" size={14} color={colors.textSecondary} style={styles.likeIcon} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}> Likes: {likesCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flex: 1,
  },
  topicContent: {
    marginBottom: SPACING.md,
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
    fontSize: 12,
    marginLeft: 4,
  },
});

export default ForumTopic;