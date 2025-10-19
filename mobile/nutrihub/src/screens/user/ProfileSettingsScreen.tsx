import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { User } from '../../types/types';
import ProfilePhotoPicker from '../../components/user/ProfilePhotoPicker';

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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const userData = await userService.getMyProfile();
      // setUser(userData);
      
      // Mock data for now
      const mockUser: User = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        name: 'John',
        surname: 'Doe',
        bio: 'Passionate about healthy cooking and nutrition',
        profile_image: null,
        profession_tags: [
          { id: 1, name: 'Dietitian', is_verified: true, created_at: new Date() },
          { id: 2, name: 'Chef', is_verified: false, created_at: new Date() }
        ],
        allergens: ['gluten', 'lactose'],
        custom_allergens: ['sesame'],
        badges: ['Top Contributor', 'Recipe Master'],
        account_warnings: [
          { id: 1, type: 'warning', reason: 'Test Warning', description: 'Test', issued_at: new Date(), issued_by: 'Moderator', is_active: true }
        ]
      };
      
      setUser(mockUser);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const profileSections: ProfileSection[] = [
    {
      id: 'my-profile',
      title: 'My Profile',
      description: 'View your profile, posts, and liked content',
      icon: 'account',
      screen: 'MyProfile'
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
      id: 'liked-posts',
      title: 'Liked Posts',
      description: 'View posts you have liked in the forum',
      icon: 'heart',
      screen: 'LikedPosts'
    },
    {
      id: 'liked-recipes',
      title: 'Liked Recipes',
      description: 'View recipes you have liked',
      icon: 'heart-outline',
      screen: 'LikedRecipes'
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
    navigation.navigate(screen as any);
  };

  const handleProfilePhotoUploaded = async (uri: string) => {
    try {
      // TODO: Replace with actual API call
      // await userService.uploadProfilePhoto(uri);
      setUser(prev => prev ? { ...prev, profile_image: uri } : null);
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile photo');
    }
  };

  const handleProfilePhotoRemoved = async () => {
    try {
      // TODO: Replace with actual API call
      // await userService.removeProfilePhoto();
      setUser(prev => prev ? { ...prev, profile_image: null } : null);
      Alert.alert('Success', 'Profile photo removed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove profile photo');
    }
  };

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ProfilePhotoPicker
        uri={user?.profile_image}
        onUploaded={handleProfilePhotoUploaded}
        onRemoved={handleProfilePhotoRemoved}
        editable={true}
        removable={true}
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
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.primary }]}>
            {user?.profession_tags?.length || 0}
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
      <View style={styles.sectionContent}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '20' }]}>
          <Icon name={item.icon as any} size={24} color={theme.primary} />
        </View>
        <View style={styles.sectionInfo}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.subtitle, { color: theme.text }]}>
              {item.title}
            </Text>
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: item.badgeColor || theme.primary }]}>
                <Text style={[textStyles.small, { color: '#fff' }]}>
                  {item.badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Profile Settings</Text>
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
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  sectionItem: {
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileSettingsScreen;
