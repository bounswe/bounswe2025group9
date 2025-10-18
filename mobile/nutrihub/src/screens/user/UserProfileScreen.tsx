import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ForumStackParamList } from '../../navigation/types';
import { ForumTopic } from '../../types/types';
import ForumPost from '../../components/forum/ForumPost';
import { forumService } from '../../services/api/forum.service';

type UserProfileRouteProp = RouteProp<ForumStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  const { username } = route.params;

  // State for user's posts (fetched independently from filters)
  const [userPosts, setUserPosts] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ALL posts and filter by username to avoid filter dependency
  const fetchUserPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all posts without any tag filters
      const allPosts = await forumService.getPosts();
      // Filter to show only posts by this user
      const filteredUserPosts = allPosts.filter(post => post.author === username);
      setUserPosts(filteredUserPosts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load user posts');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Fetch user posts on mount
  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenPost = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, textStyles.body]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUserPosts}
          >
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}> 
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.placeholder }]}>
              <Icon name="account" size={36} color={theme.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.username, textStyles.heading4]}>{username}</Text>
              {/* Profession/credential badges placeholder; extend when backend exposes fields */}
              <View style={styles.badgesRow}>
                {/* Example badge rendering: uncomment and populate from profile data when available */}
                {/* <View style={[styles.badge, { backgroundColor: `${theme.primary}20` }]}> */}
                {/*   <Icon name="certificate" size={14} color={theme.primary} style={styles.badgeIcon} /> */}
                {/*   <Text style={[styles.badgeText, { color: theme.primary }]}>Dietitian</Text> */}
                {/* </View> */}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ForumPost
            post={item}
            onPress={handleOpenPost}
            onLike={() => { /* like handled on detail/list screens */ }}
            onComment={handleOpenPost}
            onAuthorPress={() => { /* already on profile */ }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="post-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, textStyles.body]}>No posts from this user yet.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  username: {
    marginBottom: SPACING.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.xs,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 50,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;


