import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MainTabParamList } from '../../navigation/types';
import { ForumTopic, User } from '../../types/types';
import ForumPost from '../../components/forum/ForumPost';
import { forumService } from '../../services/api/forum.service';
import ProfilePhotoPicker from '../../components/user/ProfilePhotoPicker';
import { userService } from '../../services/api/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

type MyProfileNavigationProp = BottomTabNavigationProp<MainTabParamList, 'MyProfile'>;

const MyProfileScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<MyProfileNavigationProp>();
  const { user: currentUser, updateUser } = useAuth();

  const getCurrentUserDisplayName = (): string => {
    if (!currentUser) return '';
    if (currentUser.name || currentUser.surname) {
      return `${currentUser.name || ''} ${currentUser.surname || ''}`.trim();
    }
    return currentUser.username;
  };

  // State for user's posts (fetched independently from filters)
  const [userPosts, setUserPosts] = useState<ForumTopic[]>([]);
  const [likedPosts, setLikedPosts] = useState<ForumTopic[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'shared' | 'liked'>('shared');
  const [likedFilter, setLikedFilter] = useState<'all' | 'recipes'>('all');
  const [loading, setLoading] = useState(true);
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ALL posts and filter by username to avoid filter dependency
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const profile = await userService.getMyProfile(true);
      setUserProfile(profile);

      // Fetch all posts and filter by current user
      const allPosts = await forumService.getPosts();
      const userPosts = allPosts.filter(post => post.author === currentUser.username);
      setUserPosts(userPosts);

      // Fetch liked posts
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
  }, [currentUser]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh profile and liked posts on screen focus so it stays in sync
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          // Refresh profile data
          const profile = await userService.getMyProfile(true);
          setUserProfile(profile);
          // Also update the AuthContext
          updateUser(profile);
          
          // Refresh liked posts
          const allPosts = await forumService.getPosts();
          const likedIdsRaw = await AsyncStorage.getItem('nutrihub_liked_posts');
          const likedIds: number[] = likedIdsRaw ? JSON.parse(likedIdsRaw) : [];
          const liked = allPosts.filter(p => likedIds.includes(p.id));
          setLikedPosts(liked);
        } catch (error) {
          console.warn('Failed to refresh profile data on focus:', error);
        }
      };
      refreshData();
    }, [])
  );

  const handleBack = () => {
    navigation.navigate('Home');
  };

  const handleOpenPost = (post: ForumTopic) => {
    // Navigate to Forum tab and then to PostDetail
    // @ts-ignore - nested navigation params for nested stack
    navigation.navigate('Forum', {
      screen: 'PostDetail',
      params: { postId: post.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>My Profile</Text>
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>My Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, textStyles.body, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUserData}
          >
            <Text style={[styles.retryButtonText, { color: theme.background }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>My Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, textStyles.body]}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = getCurrentUserDisplayName();
  const filteredLikedPosts = likedFilter === 'recipes' 
    ? likedPosts.filter(post => post.tags.includes('recipe'))
    : likedPosts;

  const currentPosts = viewMode === 'shared' ? userPosts : filteredLikedPosts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}> 
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>My Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={[{ key: 'profile' }, { key: 'posts' }]}
        renderItem={({ item }) => {
          if (item.key === 'profile') {
            return (
              <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
              <ProfilePhotoPicker
                uri={userProfile.profile_image}
                uploading={photoUpdating}
                onUploaded={async (localUri: string) => {
                  try {
                    setPhotoUpdating(true);
                    const name = localUri.split('/').pop() || 'profile.jpg';
                    const res = await userService.uploadProfilePhoto(localUri, name);

                    setUserProfile(prev => prev ? { ...prev, profile_image: res.profile_image } : prev);
                    
                    try {
                      const refreshed = await userService.getMyProfile(true);
                      setUserProfile(refreshed);
                      // Also update the AuthContext
                      updateUser(refreshed);
                    } catch (refreshError) {
                      console.warn('Failed to refresh profile after upload', refreshError);
                    }
                  } catch (error) {
                    console.error('Upload failed:', error);
                    const message = error instanceof Error ? error.message : String(error);
                    Alert.alert('Upload Failed', `Failed to upload image: ${message}`);
                  } finally {
                      setPhotoUpdating(false);
                    }
                  }}
                  onRemoved={async () => {
                    try {
                      setPhotoUpdating(true);
                      await userService.removeProfilePhoto();
                      setUserProfile(prev => prev ? { ...prev, profile_image: null } : prev);
                      
                      try {
                        const refreshed = await userService.getMyProfile(true);
                        setUserProfile(refreshed);
                        // Also update the AuthContext
                        updateUser(refreshed);
                      } catch (refreshError) {
                        console.warn('Failed to refresh profile after removal', refreshError);
                      }
                    } catch (error) {
                      console.error('Error removing photo:', error);
                      const message = error instanceof Error ? error.message : String(error);
                      Alert.alert('Remove Failed', `Failed to remove image: ${message}`);
                    } finally {
                      setPhotoUpdating(false);
                    }
                  }}
                />
                <Text style={[styles.displayName, textStyles.heading2, { color: theme.text }]}>
                  {displayName}
                </Text>
                <Text style={[styles.username, textStyles.body, { color: theme.textSecondary }]}>
                  @{userProfile.username}
                </Text>
                {userProfile.bio && (
                  <Text style={[styles.bio, textStyles.body, { color: theme.text }]}>
                    {userProfile.bio}
                  </Text>
                )}
              </View>
            );
          }

          return (
            <View style={styles.postsSection}>
              <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    viewMode === 'shared' && { borderBottomColor: theme.primary }
                  ]}
                  onPress={() => setViewMode('shared')}
                >
                  <Text
                    style={[
                      textStyles.body,
                      { color: viewMode === 'shared' ? theme.primary : theme.text }
                    ]}
                  >
                    Shared ({userPosts.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    viewMode === 'liked' && { borderBottomColor: theme.primary }
                  ]}
                  onPress={() => setViewMode('liked')}
                >
                  <Text
                    style={[
                      textStyles.body,
                      { color: viewMode === 'liked' ? theme.primary : theme.text }
                    ]}
                  >
                    Liked ({likedPosts.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {viewMode === 'liked' && (
                <View style={[styles.filterContainer, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.filterTab,
                      likedFilter === 'all' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setLikedFilter('all')}
                  >
                    <Text
                      style={[
                        textStyles.caption,
                        { color: likedFilter === 'all' ? theme.background : theme.text }
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterTab,
                      likedFilter === 'recipes' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setLikedFilter('recipes')}
                  >
                    <Text
                      style={[
                        textStyles.caption,
                        { color: likedFilter === 'recipes' ? theme.background : theme.text }
                      ]}
                    >
                      Recipes
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <FlatList
                data={currentPosts}
                renderItem={({ item }) => (
                  <ForumPost
                    post={item}
                    onPress={() => handleOpenPost(item)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon 
                      name={viewMode === 'shared' ? 'post' : 'heart-outline'} 
                      size={48} 
                      color={theme.textSecondary} 
                    />
                    <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                      {viewMode === 'shared' 
                        ? 'No posts shared yet' 
                        : 'No liked posts yet'
                      }
                    </Text>
                  </View>
                }
              />
            </View>
          );
        }}
        keyExtractor={(item) => item.key}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  profileSection: {
    padding: SPACING.lg,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  displayName: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  username: {
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  bio: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  postsSection: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default MyProfileScreen;
