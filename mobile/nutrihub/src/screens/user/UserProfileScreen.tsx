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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ForumStackParamList } from '../../navigation/types';
import { ForumTopic, User } from '../../types/types';
import ForumPost from '../../components/forum/ForumPost';
import { forumService } from '../../services/api/forum.service';
import ProfilePhotoPicker from '../../components/user/ProfilePhotoPicker';
import { userService } from '../../services/api/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

type UserProfileRouteProp = RouteProp<ForumStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  const { username } = route.params;
  const { user: currentUser } = useAuth();

  const getCurrentUserDisplayName = (): string => {
    if (!currentUser) return '';
    if (currentUser.name || currentUser.surname) {
      return `${currentUser.name || ''} ${currentUser.surname || ''}`.trim();
    }
    return currentUser.username;
  };

  // Owner check computed later when userProfile is known; default false initially
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // State for user's posts (fetched independently from filters)
  const [userPosts, setUserPosts] = useState<ForumTopic[]>([]);
  const [likedPosts, setLikedPosts] = useState<ForumTopic[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'shared' | 'liked'>('shared');
  const [likedFilter, setLikedFilter] = useState<'all' | 'recipes'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ALL posts and filter by username to avoid filter dependency
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Attempt to fetch profile (flexible endpoint)
      let fetchedProfile: User | null = null;
      try {
        fetchedProfile = await userService.getUserByUsername(username);
        setUserProfile(fetchedProfile);
      } catch (e) {
        fetchedProfile = null;
        setUserProfile(null);
      }

      // Compute owner after profile fetch
      const displayName = getCurrentUserDisplayName();
      const owner = Boolean(
        currentUser && (
          currentUser.username === username ||
          username === displayName ||
          (fetchedProfile && currentUser.id === fetchedProfile.id)
        )
      );
      setIsOwner(owner);

      // Fetch all posts without tag filters
      const allPosts = await forumService.getPosts();
      // Determine match by username or full name (for flexibility)
      const matchesUser = (post: ForumTopic): boolean => {
        if (post.author === username) return true;
        const fullName = fetchedProfile && (fetchedProfile.name || fetchedProfile.surname)
          ? `${fetchedProfile.name || ''} ${fetchedProfile.surname || ''}`.trim()
          : '';
        if (fullName && post.author === fullName) return true;
        // Fallback: if viewing own profile and backend uses full name for author field
        if (owner && displayName && post.author === displayName) return true;
        return false;
      };
      const filteredUserPosts = allPosts.filter(matchesUser);
      setUserPosts(filteredUserPosts);

      // Build liked posts from AsyncStorage and current posts
      const likedIdsRaw = await AsyncStorage.getItem('nutrihub_liked_posts');
      const likedIds: number[] = likedIdsRaw ? JSON.parse(likedIdsRaw) : [];
      const liked = allPosts.filter(p => likedIds.includes(p.id));
      setLikedPosts(liked);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh liked posts on screen focus so it stays in sync with likes toggled elsewhere
  useFocusEffect(
    useCallback(() => {
      const refreshLiked = async () => {
        try {
          const allPosts = await forumService.getPosts();
          const likedIdsRaw = await AsyncStorage.getItem('nutrihub_liked_posts');
          const likedIds: number[] = likedIdsRaw ? JSON.parse(likedIdsRaw) : [];
          const liked = allPosts.filter(p => likedIds.includes(p.id));
          setLikedPosts(liked);
        } catch {}
      };
      refreshLiked();
    }, [])
  );

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
            onPress={fetchUserData}
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
        data={
          viewMode === 'shared'
            ? userPosts
            : likedFilter === 'recipes'
              ? likedPosts.filter(p => (p.tags || []).some(t => t.toLowerCase().includes('recipe')))
              : likedPosts
        }
        keyExtractor={(item) => `${viewMode}-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <ProfilePhotoPicker
                uri={userProfile?.profilePhoto || null}
                editable={Boolean(currentUser && (currentUser.username === username || username === getCurrentUserDisplayName() || (userProfile && currentUser.id === userProfile.id)))}
                onUploaded={async (localUri) => {
                  try {
                    const name = localUri.split('/').pop() || 'profile.jpg';
                    const res = await userService.uploadProfilePhoto(localUri, name);
                    setUserProfile(prev => prev ? { ...prev, profilePhoto: res.profilePhoto } : prev);
                  } catch (e) {}
                }}
                onRemoved={async () => {
                  try {
                    await userService.removeProfilePhoto();
                    setUserProfile(prev => prev ? { ...prev, profilePhoto: undefined } : prev);
                  } catch (e) {}
                }}
                removable={!!userProfile?.profilePhoto}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, textStyles.heading4]}>
                  {(userProfile?.name || userProfile?.surname || (isOwner && (currentUser?.name || currentUser?.surname)))
                    ? `${userProfile?.name || currentUser?.name || ''} ${userProfile?.surname || currentUser?.surname || ''}`.trim()
                    : `@${username}`}
                </Text>
                {(userProfile?.name || userProfile?.surname || (isOwner && (currentUser?.name || currentUser?.surname))) && (
                  <Text style={[styles.usernameText, textStyles.caption]}>@{username}</Text>
                )}
                {userProfile?.profession && (
                  <View style={[styles.professionBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <Icon name="certificate" size={14} color={theme.primary} style={styles.badgeIcon} />
                    <Text style={[styles.badgeText, { color: theme.primary }]}>{userProfile.profession}</Text>
                  </View>
                )}
                {userProfile?.bio && (
                  <Text style={[styles.bioText, textStyles.body]}>{userProfile.bio}</Text>
                )}
                {userProfile?.badges && userProfile.badges.length > 0 && (
                  <View style={styles.badgesRow}>
                    {userProfile.badges.map((badge, index) => (
                      <View key={index} style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
                        <Icon name="star" size={12} color={theme.primary} style={styles.badgeIcon} />
                        <Text style={[styles.badgeText, { color: theme.primary }]}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Tabs for Posts / Liked */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, viewMode === 'shared' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                onPress={() => setViewMode('shared')}
              >
                <Text style={[styles.tabText, { color: viewMode === 'shared' ? theme.primary : theme.text }]}>Posts</Text>
              </TouchableOpacity>

              {(() => {
                const displayName = getCurrentUserDisplayName();
                const isOwner = !!currentUser && (currentUser.username === username || username === displayName || (userProfile && currentUser.id === userProfile.id));
                return isOwner;
              })() && (
                <TouchableOpacity
                  style={[styles.tabButton, viewMode === 'liked' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                  onPress={() => setViewMode('liked')}
                >
                  <Text style={[styles.tabText, { color: viewMode === 'liked' ? theme.primary : theme.text }]}>Liked</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sub-filters when on Liked tab: All / Recipes */}
            {viewMode === 'liked' && (() => {
              const displayName = getCurrentUserDisplayName();
              const isOwner = !!currentUser && (currentUser.username === username || username === displayName || (userProfile && currentUser.id === userProfile.id));
              return isOwner;
            })() && (
              <View style={styles.subFiltersContainer}>
                <TouchableOpacity
                  style={[styles.chip, likedFilter === 'all' && { backgroundColor: `${theme.primary}20` }]}
                  onPress={() => setLikedFilter('all')}
                >
                  <Text style={[styles.chipText, { color: likedFilter === 'all' ? theme.primary : theme.text }]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, likedFilter === 'recipes' && { backgroundColor: `${theme.primary}20` }]}
                  onPress={() => setLikedFilter('recipes')}
                >
                  <Text style={[styles.chipText, { color: likedFilter === 'recipes' ? theme.primary : theme.text }]}>Recipes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ForumPost
            post={item}
            onPress={handleOpenPost}
            onLike={() => {}}
            onComment={handleOpenPost}
            onAuthorPress={() => navigation.navigate('UserProfile', { username: item.author })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="post-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, textStyles.body]}>
              {viewMode === 'shared' ? 'No posts from this user yet.' : 'No liked posts yet.'}
            </Text>
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
  displayName: {
    marginBottom: SPACING.xs,
  },
  username: {
    marginBottom: SPACING.xs,
  },
  usernameText: {
    marginBottom: SPACING.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tabButton: {
    marginRight: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  tabText: {
    fontWeight: '600',
  },
  subFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
  },
  chipText: {
    fontWeight: '600',
  },
  professionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  bioText: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    marginLeft: SPACING.xs,
    fontWeight: '600',
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


