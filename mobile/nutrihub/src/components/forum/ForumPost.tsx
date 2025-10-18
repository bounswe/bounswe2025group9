/**
 * ForumPost Component
 * 
 * A flexible component for displaying forum posts with various interaction options.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { ForumTopic } from '../../types/types';

interface ForumPostProps {
  /**
   * Forum post data to display
   */
  post: ForumTopic;
  
  /**
   * Function to call when the post is pressed
   */
  onPress?: (post: ForumTopic) => void;
  
  /**
   * Function to call when the like button is pressed
   */
  onLike?: (post: ForumTopic) => void;
  
  /**
   * Function to call when the comment button is pressed
   */
  onComment?: (post: ForumTopic) => void;

  /**
   * Function to call when the author (avatar/name) is pressed
   */
  onAuthorPress?: (post: ForumTopic) => void;
  
  /**
   * Whether to show a truncated preview of the post content
   * @default true
   */
  preview?: boolean;
  
  /**
   * Number of lines to show in preview mode
   * @default 3
   */
  previewLines?: number;
  
  /**
   * Whether to show tag badges
   * @default true
   */
  showTags?: boolean;
  
  /**
   * Additional style to apply to the container
   */
  style?: ViewStyle;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * Component for displaying forum posts
 */
const ForumPost: React.FC<ForumPostProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onAuthorPress,
  preview = true,
  previewLines = 3,
  showTags = true,
  style,
  testID,
}) => {
  const { theme, textStyles } = useTheme();
  
  // Format date to a human-readable string
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };
  
  // Get icon for tag
  const getTagIcon = (tagName: string): React.ComponentProps<typeof Icon>['name'] => {
    // Check for prefix 'dietary' in case of inconsistent tag naming
    const lowerTag = tagName.toLowerCase();
    if (lowerTag.includes('diet') || lowerTag.includes('nutrition') || lowerTag.includes('tip')) {
      return 'lightbulb-outline';
    }
    if (lowerTag.includes('recipe')) {
      return 'chef-hat';
    }
    if (lowerTag.includes('meal') || lowerTag.includes('plan')) {
      return 'calendar-text';
    }
    return 'tag';
  };
  
  // Get color for tag
  const getTagColor = (tagName: string): string => {
    // Check for prefix in case of inconsistent tag naming
    const lowerTag = tagName.toLowerCase();
    if (lowerTag.includes('diet') || lowerTag.includes('nutrition') || lowerTag.includes('tip')) {
      return '#4CAF50'; // Green
    }
    if (lowerTag.includes('recipe')) {
      return '#FFA000'; // Amber
    }
    if (lowerTag.includes('meal') || lowerTag.includes('plan')) {
      return '#2196F3'; // Blue
    }
    return theme.primary;
  };
  
  // Handle post press
  const handlePress = () => {
    if (onPress) {
      onPress(post);
    }
  };
  
  // Handle like press
  const handleLike = () => {
    if (onLike) {
      // Let parent handle like status updates completely
      onLike(post);
    }
  };
  
  // Handle comment press
  const handleComment = () => {
    if (onComment) {
      onComment(post);
    }
  };

  // Handle author press
  const handleAuthor = () => {
    if (onAuthorPress) {
      onAuthorPress(post);
    }
  };
  
  // Render tag badge
  const renderTag = (tag: string, index: number) => (
    <View 
      key={index} 
      style={[
        styles.tagContainer, 
        { backgroundColor: `${getTagColor(tag)}20` } // 20% opacity
      ]}
    >
      <Icon name={getTagIcon(tag)} size={12} color={getTagColor(tag)} style={styles.tagIcon} />
      <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
        {tag}
      </Text>
    </View>
  );
  
  // Create like button text style based on post props, not local state
  const likeButtonTextStyle: TextStyle = {
    ...styles.actionText,
    ...(post.isLiked ? { color: theme.primary } : {})
  };
  
  return (
    <Card
      style={style}
      onPress={handlePress}
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorContainer} onPress={handleAuthor} activeOpacity={0.7}>
          <Icon name="account-circle" size={24} color={theme.primary} />
          <View style={styles.authorTextContainer}>
            <Text style={[styles.authorName, textStyles.subtitle]}>{post.author}</Text>
            <Text style={[styles.postDate, textStyles.small]}>{formatDate(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Tags */}
        {showTags && post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => renderTag(tag, index))}
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, textStyles.heading3]}>{post.title}</Text>
        <Text 
          style={[styles.content, textStyles.body]}
          numberOfLines={preview ? previewLines : undefined}
        >
          {post.content}
        </Text>
        
        {preview && post.content.length > 150 && (
          <TouchableOpacity onPress={handlePress}>
            <Text style={[styles.readMore, { color: theme.primary }]}>
              Read more
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Footer with actions */}
      <View style={[styles.footer, { borderTopColor: theme.divider }]}>
        <Button
          iconName={post.isLiked ? "thumb-up" : "thumb-up-outline"}
          title={(post.likesCount || 0).toString()}
          variant="text"
          size="small"
          onPress={handleLike}
          style={styles.actionButton}
          textStyle={likeButtonTextStyle}
        />
        
        <Button
          iconName="comment-outline"
          title={(post.commentsCount || 0).toString()}
          variant="text"
          size="small"
          onPress={handleComment}
          style={styles.actionButton}
          textStyle={styles.actionText}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorTextContainer: {
    marginLeft: SPACING.xs,
  },
  authorName: {
    marginBottom: 2,
  },
  postDate: {},
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagIcon: {
    marginRight: 3,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  content: {
    lineHeight: 22,
  },
  readMore: {
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
  },
  actionButton: {
    marginRight: SPACING.md,
  },
  actionText: {
    fontWeight: '500',
  },
});

export default ForumPost;