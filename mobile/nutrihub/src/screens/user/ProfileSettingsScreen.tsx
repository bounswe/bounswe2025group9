import React, { useState, useEffect } from 'react';
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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { User } from '../../types/types';
import ProfilePhotoPicker from '../../components/user/ProfilePhotoPicker';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api/user.service';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  screen: string;
  badge?: string;
  badgeColor?: string;
}

const ProfileSettingsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Use current user from auth context as base
      if (currentUser) {
        try {
          // Fetch additional profile data from API
          console.log('ProfileSettingsScreen: Loading user profile...');
          const additionalData = await userService.getMyProfile();
          console.log('ProfileSettingsScreen: Loaded profile data:', additionalData);
          console.log('ProfileSettingsScreen: Tags count:', additionalData?.tags?.length || 0);
          setUser(additionalData);
        } catch (error) {
          // Fallback to current user data if API fails
          console.warn('Failed to fetch profile data, using auth context data:', error);
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const profileSections: ProfileSection[] = [
    {
      id: 'my-posts',
      title: 'My Posts & Content',
      description: 'View your posts, liked content, and recipes',
      icon: 'post',
      screen: 'MyPosts'
    },
    {
      id: 'allergens',
      title: 'Allergens',
      description: 'Manage your food allergies and sensitivities',
      icon: 'alert-circle',
      screen: 'AllergenSelection',
      badge: user?.allergens?.length ? `${user.allergens.length + (user.custom_allergens?.length || 0)}` : undefined,
      badgeColor: theme.primary
    },
    {
      id: 'recipes',
      title: 'Personal Recipes',
      description: 'View and manage your personal recipe collection',
      icon: 'chef-hat',
      screen: 'PersonalRecipes'
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Update your contact details and privacy settings',
      icon: 'account-edit',
      screen: 'ContactInfo'
    },
    {
      id: 'profession-tags',
      title: 'Profession Tags',
      description: 'Manage your professional credentials and certifications',
      icon: 'badge-account',
      screen: 'ProfessionTags',
      badge: user?.profession_tags?.length ? `${user.profession_tags.length}` : undefined,
      badgeColor: theme.warning
    },
    {
      id: 'account-warnings',
      title: 'Account Warnings',
      description: 'View warnings, post removals, bans and suspensions',
      icon: 'alert',
      screen: 'AccountWarnings',
      badge: user?.account_warnings?.filter(w => w.is_active).length ? `${user.account_warnings.filter(w => w.is_active).length}` : undefined,
      badgeColor: theme.error
    }
  ];

  const handleNavigateToSection = (screen: string) => {
    // Navigate to the specific screen
    (navigation as any).navigate(screen);
  };

  const handleProfilePhotoUploaded = async (uri: string) => {
    try {
      // TODO: Replace with actual API call
      // await userService.uploadProfilePhoto(uri);
      console.log('Profile photo uploaded:', uri);
      // Update local state immediately
      setUser(prev => prev ? { ...prev, profile_image: uri } : prev);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo');
    }
  };

  const handleProfilePhotoRemoved = async () => {
    try {
      // TODO: Replace with actual API call
      // await userService.removeProfilePhoto();
      console.log('Profile photo removed');
      // Update local state immediately
      setUser(prev => prev ? { ...prev, profile_image: undefined } : prev);
    } catch (error) {
      console.error('Error removing profile photo:', error);
      Alert.alert('Error', 'Failed to remove profile photo');
    }
  };

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ProfilePhotoPicker
        uri={user?.profile_image || null}
        onUploaded={handleProfilePhotoUploaded}
        onRemoved={handleProfilePhotoRemoved}
        editable={true}
        removable={!!user?.profile_image}
      />
      
      <View style={styles.userInfo}>
        <Text style={[textStyles.heading3, { color: theme.text }]}>
          {user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.username}
        </Text>
        <Text style={[textStyles.body, { color: theme.textSecondary }]}>
          @{user?.username}
        </Text>
        {user?.bio && (
          <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.xs }]}>
            {user.bio}
          </Text>
        )}

        {/* Profession Tags */}
        {user?.tags && user.tags.length > 0 && (
          <View style={styles.professionTagsContainer}>
            <Text style={[textStyles.caption, { color: theme.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.xs }]}>
              Profession Tags
            </Text>
            <View style={styles.professionTagsRow}>
              {user.tags.map((tag) => (
                <View key={tag.id} style={[styles.professionTag, { backgroundColor: theme.primary }]}>
                  <Text style={[textStyles.caption, { color: '#fff' }]}>
                    {tag.name}
                  </Text>
                  {tag.is_verified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                      <Icon name="check-circle" size={12} color="#fff" style={styles.tagIcon} />
                    </View>
                  ) : (
                    <View style={[styles.unverifiedBadge, { backgroundColor: theme.warning }]}>
                      <Icon name="clock-outline" size={12} color="#fff" style={styles.tagIcon} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.primary }]}>
            {user?.tags?.length || 0}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Profession Tags
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.success }]}>
            {user?.badges?.length || 0}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Badges
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.warning }]}>
            {(user?.allergens?.length || 0) + (user?.custom_allergens?.length || 0)}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Allergens
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSectionItem = ({ item }: { item: ProfileSection }) => (
    <TouchableOpacity
      style={[styles.sectionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => handleNavigateToSection(item.screen)}
    >
      <View style={styles.sectionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
          <Icon name={item.icon as any} size={24} color={theme.primary} />
        </View>
        <View style={styles.sectionContent}>
          <Text style={[textStyles.heading4, { color: theme.text }]}>{item.title}</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.sectionRight}>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
            <Text style={[textStyles.small, { color: '#fff' }]}>{item.badge}</Text>
          </View>
        )}
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.md }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, textStyles.heading3]}>My Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={renderProfileHeader}
        data={profileSections}
        renderItem={renderSectionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  profileHeader: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  userInfo: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionContent: {
    flex: 1,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionTagsContainer: {
    marginTop: SPACING.sm,
  },
  professionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  professionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
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
});

export default ProfileSettingsScreen;