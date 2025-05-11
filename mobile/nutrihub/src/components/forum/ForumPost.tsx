/**
 * ForumPost Component
 * 
 * A flexible component for displaying forum posts with various interaction options.
 */

import React, { useState } from 'react';
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
  preview = true,
  previewLines = 3,
  showTags = true,
  style,
  testID,
}) => {
  const { theme, textStyles } = useTheme();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  
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
  
  // Handle post press
  const handlePress = () => {
    if (onPress) {
      onPress(post);
    }
  };
  
  // Handle like press
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
    
    if (onLike) {
      onLike({ ...post, isLiked: !isLiked, likesCount: isLiked ? likesCount - 1 : likesCount + 1 });
    }
  };
  
  // Handle comment press
  const handleComment = () => {
    if (onComment) {
      onComment(post);
    }
  };
  
  // Render tag badge
  const renderTag = (tag: string, index: number) => (
    <View 
      key={index} 
      style={[
        styles.tagContainer, 
        { backgroundColor: theme.badgeBackground }
      ]}
    >
      <Text style={[styles.tagText, { color: theme.badgeText }]}>
        {tag}
      </Text>
    </View>
  );
  
  // Create like button text style
  const likeButtonTextStyle: TextStyle = {
    ...styles.actionText,
    ...(isLiked ? { color: theme.primary } : {})
  };
  
  return (
    <Card
      style={style}
      onPress={handlePress}
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <Icon name="account-circle" size={24} color={theme.primary} />
          <View style={styles.authorTextContainer}>
            <Text style={[styles.authorName, textStyles.subtitle]}>{post.author}</Text>
            <Text style={[styles.postDate, textStyles.small]}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        
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
          iconName={isLiked ? "thumb-up" : "thumb-up-outline"}
          title={likesCount.toString()}
          variant="text"
          size="small"
          onPress={handleLike}
          style={styles.actionButton}
          textStyle={likeButtonTextStyle}
        />
        
        <Button
          iconName="comment-outline"
          title={post.commentsCount.toString()}
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
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
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