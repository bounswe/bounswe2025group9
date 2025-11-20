import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ForumStackParamList } from '../../navigation/types';
import { ForumTopic, User, ProfessionTag } from '../../types/types';
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

  const { username, userId } = route.params;
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const privacySettings = userProfile?.privacy_settings;
  const isFieldVisible = (flag?: boolean) => flag !== false;

  const canShowProfessionTags = isOwner || isFieldVisible(privacySettings?.show_profession_tags);
  const canShowBadges = isOwner || isFieldVisible(privacySettings?.show_badges);
  const canShowPosts = isOwner || isFieldVisible(privacySettings?.show_posts);
  const canShowRecipes = isOwner || isFieldVisible(privacySettings?.show_recipes);
  const canShowLocation = isOwner || isFieldVisible(privacySettings?.show_location);
  const canShowLiked = isOwner;

  const professionTags = useMemo<ProfessionTag[]>(() => {
    if (!userProfile) return [];
    if (userProfile.tags && userProfile.tags.length > 0) {
      return userProfile.tags;
    }
    if (userProfile.profession_tags && userProfile.profession_tags.length > 0) {
      return userProfile.profession_tags;
    }
    return [];
  }, [userProfile]);

  const listData = useMemo<ForumTopic[]>(() => {
    if (viewMode === 'liked') {
      if (!canShowLiked) return [];
      const likedRecipeOnly = likedPosts.filter(post =>
        (post.tags || []).some(tag => tag?.toLowerCase().includes('recipe'))
      );
      return likedFilter === 'recipes' ? likedRecipeOnly : likedPosts;
    }

    return canShowPosts ? userPosts : [];
  }, [viewMode, canShowLiked, likedFilter, likedPosts, canShowPosts, userPosts]);

  // Fetch ALL posts and filter by username to avoid filter dependency
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Attempt to fetch profile using the new method
      let fetchedProfile: User | null = null;
      try {
        fetchedProfile = await userService.getOtherUserProfile(username, userId);
        setUserProfile(fetchedProfile);
        
        // Set follow state if available from profile
        if (fetchedProfile) {
          setIsFollowing(fetchedProfile.is_following || false);
          setFollowersCount(fetchedProfile.followers_count || 0);
          setFollowingCount(fetchedProfile.following_count || 0);
        }
      } catch (e) {
        console.error('Error fetching user profile:', e);
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

  useEffect(() => {
    if (viewMode === 'liked' && !canShowLiked) {
      setViewMode('shared');
      return;
    }

    if (viewMode === 'shared' && !canShowPosts && canShowLiked) {
      setViewMode('liked');
    }
  }, [viewMode, canShowLiked, canShowPosts]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenPost = (post: ForumTopic) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleReportUser = () => {
    // Navigate to report user screen
    navigation.navigate('ReportUser' as any, { 
      userId: userProfile?.id || 0, 
      username: username 
    });
  };

  const handleViewDocument = async (tag: ProfessionTag) => {
    if (tag.certificate) {
      try {
        await WebBrowser.openBrowserAsync(tag.certificate, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
          controlsColor: theme.primary,
        });
      } catch (error) {
        console.error('Error opening document:', error);
        Alert.alert('Error', 'Failed to open document. Please try again.');
      }
    } else {
      Alert.alert('No Certificate', `No certificate document is available for ${tag.name}.`);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      const response = await userService.toggleFollow(username);
      
      // Update follow state
      const newIsFollowing = !isFollowing;
      setIsFollowing(newIsFollowing);
      
      // Update followers count
      setFollowersCount(prev => newIsFollowing ? prev + 1 : Math.max(0, prev - 1));
      
      Alert.alert('Success', response.message);
    } catch (err) {
      console.error('Error toggling follow:', err);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowersPress = () => {
    navigation.navigate('FollowersList', { username });
  };

  const handleFollowingPress = () => {
    navigation.navigate('FollowingList', { username });
  };

  const renderEmptyComponent = () => {
    let message = '';
    let iconName: React.ComponentProps<typeof Icon>['name'] = 'post-outline';

    if (viewMode === 'liked') {
      message = 'No liked posts yet.';
      iconName = 'heart-outline';
    } else {
      message = canShowPosts ? 'No posts from this user yet.' : 'This user keeps their posts private.';
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name={iconName} size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyText, textStyles.body]}>{message}</Text>
      </View>
    );
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
        {!isOwner && (
          <TouchableOpacity onPress={handleReportUser} style={styles.reportButton}>
            <Icon name="flag" size={20} color={theme.error} />
          </TouchableOpacity>
        )}
        {isOwner && <View style={styles.headerSpacer} />}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => `${viewMode}-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ProfilePhotoPicker
                uri={userProfile?.profile_image || null}
                editable={isOwner}
                onUploaded={async (localUri) => {
                  try {
                    const name = localUri.split('/').pop() || 'profile.jpg';
                    const res = await userService.uploadProfilePhoto(localUri, name);

                    setUserProfile(prev => prev ? { ...prev, profile_image: res.profile_image } : prev);

                    try {
                      const refreshedProfile = await userService.getOtherUserProfile(
                        username,
                        userProfile?.id ?? userId
                      );
                      setUserProfile(refreshedProfile);
                    } catch (refreshError) {
                      // Silent refresh failure
                    }
                  } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    Alert.alert('Upload Failed', `Failed to upload image: ${message}`);
                  }
                }}
                onRemoved={async () => {
                  try {
                    await userService.removeProfilePhoto();
                    setUserProfile(prev => prev ? { ...prev, profile_image: null } : prev);
                  } catch (e) {}
                }}
                removable={isOwner && !!userProfile?.profile_image}
              />
              <Text style={[styles.profileName, textStyles.heading3, { color: theme.text }]}>
                {(userProfile?.name || userProfile?.surname || (isOwner && (currentUser?.name || currentUser?.surname)))
                  ? `${userProfile?.name || currentUser?.name || ''} ${userProfile?.surname || currentUser?.surname || ''}`.trim()
                  : `@${username}`}
              </Text>
              {(userProfile?.name || userProfile?.surname || (isOwner && (currentUser?.name || currentUser?.surname))) && (
                <Text style={[styles.profileUsername, textStyles.caption, { color: theme.textSecondary }]}>@{username}</Text>
              )}
              {userProfile?.bio && (
                <Text style={[styles.profileBio, textStyles.body, { color: theme.text }]}>{userProfile.bio}</Text>
              )}
              
              {/* Follow Stats */}
              <View style={styles.followStatsRow}>
                <TouchableOpacity style={styles.followStat} onPress={handleFollowersPress}>
                  <Text style={[styles.followStatValue, textStyles.heading4, { color: theme.text }]}>
                    {followersCount}
                  </Text>
                  <Text style={[styles.followStatLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Followers
                  </Text>
                </TouchableOpacity>
                <View style={[styles.followStatDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity style={styles.followStat} onPress={handleFollowingPress}>
                  <Text style={[styles.followStatValue, textStyles.heading4, { color: theme.text }]}>
                    {followingCount}
                  </Text>
                  <Text style={[styles.followStatLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Following
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Follow Button (only show for other users) */}
              {!isOwner && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    { 
                      backgroundColor: isFollowing ? theme.surface : theme.primary,
                      borderColor: isFollowing ? theme.border : theme.primary,
                      borderWidth: isFollowing ? 1 : 0,
                    }
                  ]}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? theme.text : theme.buttonText} />
                  ) : (
                    <>
                      <Icon 
                        name={isFollowing ? "account-check" : "account-plus"} 
                        size={20} 
                        color={isFollowing ? theme.text : theme.buttonText} 
                      />
                      <Text style={[
                        textStyles.buttonText,
                        { color: isFollowing ? theme.text : theme.buttonText, marginLeft: SPACING.xs }
                      ]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, textStyles.heading4, { color: theme.primary }]}>
                    {professionTags.length}
                  </Text>
                  <Text style={[styles.statLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Profession Tags
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, textStyles.heading4, { color: theme.success }]}>
                    {userProfile?.badges?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Badges
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, textStyles.heading4, { color: theme.warning }]}>
                    {userProfile?.recipes?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Recipes
                  </Text>
                </View>
              </View>
            </View>

            {canShowProfessionTags && professionTags.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, textStyles.subtitle, { color: theme.text }]}>
                  Profession Tags
                </Text>
                <View style={styles.professionTagsRow}>
                  {professionTags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id || tag.name}
                      style={[
                        styles.professionTag, 
                        { 
                          backgroundColor: `${theme.primary}20`, 
                          borderColor: theme.primary,
                          minHeight: 40,
                        }
                      ]}
                      onPress={() => handleViewDocument(tag)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[textStyles.caption, { color: theme.primary }]}>
                        {tag.name}
                      </Text>
                      {tag.verified ? (
                        <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                          <Icon name="check-circle" size={12} color="#fff" style={styles.tagIcon} />
                          <Text style={[textStyles.small, { color: '#fff' }]}>Verified</Text>
                        </View>
                      ) : (
                        <View style={[styles.unverifiedBadge, { backgroundColor: theme.warning }]}>
                          <Icon name="clock-outline" size={12} color="#fff" style={styles.tagIcon} />
                          <Text style={[textStyles.small, { color: '#fff' }]}>Unverified</Text>
                        </View>
                      )}
                      {tag.certificate && (
                        <Icon name="file-document" size={12} color={theme.primary} style={styles.tagIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!canShowProfessionTags && !isOwner && professionTags.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                  This user keeps their profession tags private.
                </Text>
              </View>
            )}

            {canShowBadges && userProfile?.badges && userProfile.badges.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, textStyles.subtitle, { color: theme.text }]}>
                  Badges
                </Text>
                <View style={styles.badgesRow}>
                  {userProfile.badges.map((badge, index) => (
                    <View key={index} style={[styles.badge, { backgroundColor: theme.warning }]}>
                      <Icon name="medal" size={12} color="#fff" style={styles.badgeIcon} />
                      <Text style={[styles.badgeText, { color: '#fff' }]}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!canShowBadges && !isOwner && userProfile?.badges && userProfile.badges.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                  This user keeps their badges private.
                </Text>
              </View>
            )}

            {canShowRecipes && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, textStyles.subtitle, { color: theme.text }]}>
                  Recipes
                </Text>
                {userProfile?.recipes && userProfile.recipes.length > 0 ? (
                  userProfile.recipes.map((recipe) => (
                    <View key={recipe.id} style={styles.recipeItem}>
                      <Icon name="chef-hat" size={16} color={theme.primary} />
                      <Text style={[textStyles.body, { marginLeft: SPACING.xs, color: theme.text }]}>
                        {recipe.name}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                    No recipes shared yet.
                  </Text>
                )}
              </View>
            )}

            {!canShowRecipes && !isOwner && userProfile?.recipes && userProfile.recipes.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                  This user keeps their recipes private.
                </Text>
              </View>
            )}

            {(canShowLocation && userProfile?.location) || userProfile?.website ? (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, textStyles.subtitle, { color: theme.text }]}>
                  Contact
                </Text>
                <View style={styles.contactInfo}>
                  {canShowLocation && userProfile?.location && (
                    <View style={styles.contactItem}>
                      <Icon name="map-marker" size={16} color={theme.textSecondary} />
                      <Text style={[textStyles.body, { color: theme.textSecondary, marginLeft: SPACING.xs }]}>
                        {userProfile.location}
                      </Text>
                    </View>
                  )}
                  {userProfile?.website && (
                    <View style={styles.contactItem}>
                      <Icon name="web" size={16} color={theme.textSecondary} />
                      <Text style={[textStyles.body, { color: theme.primary, marginLeft: SPACING.xs }]}>
                        {userProfile.website}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {(canShowPosts || canShowLiked) && (
              <View style={[styles.tabsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.tabsContainer}>
                  {canShowPosts && (
                    <TouchableOpacity
                      style={[styles.tabButton, viewMode === 'shared' && { borderBottomColor: theme.primary }]}
                      onPress={() => setViewMode('shared')}
                    >
                      <Text style={[styles.tabText, { color: viewMode === 'shared' ? theme.primary : theme.text }]}>
                        Posts
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canShowLiked && (
                    <TouchableOpacity
                      style={[styles.tabButton, viewMode === 'liked' && { borderBottomColor: theme.primary }]}
                      onPress={() => setViewMode('liked')}
                    >
                      <Text style={[styles.tabText, { color: viewMode === 'liked' ? theme.primary : theme.text }]}>
                        Liked
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {viewMode === 'liked' && canShowLiked && (
                  <View style={styles.subFiltersContainer}>
                    <TouchableOpacity
                      style={[styles.chip, likedFilter === 'all' && { backgroundColor: `${theme.primary}20` }]}
                      onPress={() => setLikedFilter('all')}
                    >
                      <Text style={[styles.chipText, { color: likedFilter === 'all' ? theme.primary : theme.text }]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chip, likedFilter === 'recipes' && { backgroundColor: `${theme.primary}20` }]}
                      onPress={() => setLikedFilter('recipes')}
                    >
                      <Text style={[styles.chipText, { color: likedFilter === 'recipes' ? theme.primary : theme.text }]}>
                        Recipes
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
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
            onAuthorPress={() => {
              if (isOwner) {
                // Navigate to own profile tab instead of UserProfile screen
                navigation.navigate('MyProfile' as any);
              } else {
                // Navigate to other user's profile
                navigation.navigate('UserProfile', { username: item.author });
              }
            }}
          />
        )}
        ListEmptyComponent={renderEmptyComponent}
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
    paddingBottom: SPACING.xl,
  },
  headerContent: {
    paddingBottom: SPACING.lg,
  },
  profileCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  profileName: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  profileUsername: {
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  profileBio: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  followStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  followStat: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  followStatValue: {
    fontWeight: '600',
  },
  followStatLabel: {
    marginTop: SPACING.xs,
  },
  followStatDivider: {
    width: 1,
    height: 30,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    marginBottom: SPACING.xs,
  },
  statLabel: {
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  professionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  professionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagIcon: {
    marginLeft: SPACING.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badgeIcon: {
    marginRight: SPACING.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  contactInfo: {
    marginTop: SPACING.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  tabsCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
  },
  subFiltersContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  chipText: {
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
  reportButton: {
    padding: SPACING.sm,
  },
});

export default UserProfileScreen;
