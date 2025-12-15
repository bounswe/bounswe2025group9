import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { User } from '../../types/types';
import ProfilePhotoPicker from '../../components/user/ProfilePhotoPicker';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api/user.service';
import { nutritionService } from '../../services/api/nutrition.service';
import { UserMetrics } from '../../types/nutrition';
import UserMetricsModal from '../../components/nutrition/UserMetricsModal';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  screen?: string;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

const ProfileSettingsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

      // Fetch user metrics
      try {
        const userMetrics = await nutritionService.getUserMetrics();
        setMetrics(userMetrics);
      } catch (error: any) {
        // Metrics might not exist yet, that's okay
        if (error.status !== 404 && error.response?.status !== 404) {
          console.warn('Failed to fetch user metrics:', error);
        }
        setMetrics(null);
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
      id: 'user-metrics',
      title: t('profile.userMetrics'),
      description: metrics ? `${metrics.height}cm, ${metrics.weight}kg, ${metrics.age}yrs` : t('profile.setMetrics'),
      icon: 'human-male-height',
      onPress: () => setShowMetricsModal(true),
      badgeColor: theme.primary
    },
    {
      id: 'my-posts',
      title: t('profile.myPosts'),
      description: t('profile.viewPosts'),
      icon: 'post',
      screen: 'MyPosts'
    },
    {
      id: 'nutrition-tracking',
      title: t('profile.nutritionTracking'),
      description: t('profile.trackDaily'),
      icon: 'food-apple',
      screen: 'NutritionTracking',
      badgeColor: theme.success
    },
    {
      id: 'allergens',
      title: t('profile.allergens'),
      description: t('profile.manageAllergens'),
      icon: 'alert-circle',
      screen: 'AllergenSelection',
      badge: user?.allergens?.length ? `${user.allergens.length + (user.custom_allergens?.length || 0)}` : undefined,
      badgeColor: theme.primary
    },
    {
      id: 'recipes',
      title: t('profile.personalRecipes'),
      description: t('profile.viewRecipes'),
      icon: 'chef-hat',
      screen: 'PersonalRecipes'
    },
    {
      id: 'contact',
      title: t('profile.contactInfo'),
      description: t('profile.updateContact'),
      icon: 'account-edit',
      screen: 'ContactInfo'
    },
    {
      id: 'profession-tags',
      title: t('profile.professionTags'),
      description: t('profile.manageTags'),
      icon: 'badge-account',
      screen: 'ProfessionTags',
      badge: user?.profession_tags?.length ? `${user.profession_tags.length}` : undefined,
      badgeColor: theme.warning
    },
    {
      id: 'language',
      title: t('profile.language'),
      description: t('profile.changeLanguage'),
      icon: 'translate',
      screen: 'LanguageSettings',
      badgeColor: theme.info
    },
    {
      id: 'account-warnings',
      title: t('profile.accountWarnings'),
      description: t('profile.viewWarnings'),
      icon: 'alert',
      screen: 'AccountWarnings',
      badge: user?.account_warnings?.filter(w => w.is_active).length ? `${user.account_warnings.filter(w => w.is_active).length}` : undefined,
      badgeColor: theme.error
    }
  ];

  const handleNavigateToSection = (item: ProfileSection) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      // Navigate to the specific screen
      (navigation as any).navigate(item.screen);
    }
  };

  const handleMetricsSaved = async (newMetrics: UserMetrics) => {
    setMetrics(newMetrics);
    setShowMetricsModal(false);
    // Reload profile to refresh sections
    await loadUserProfile();
  };

  const handleProfilePhotoUploaded = async (uri: string) => {
    try {
      const name = uri.split('/').pop() || 'profile.jpg';
      const res = await userService.uploadProfilePhoto(uri, name);
      
      // Add cache-busting parameter to force image reload
      const cacheBustedUrl = res.profile_image 
        ? `${res.profile_image}${res.profile_image.includes('?') ? '&' : '?'}t=${Date.now()}`
        : res.profile_image;
      
      // Update local state with the server response
      setUser(prev => prev ? { ...prev, profile_image: cacheBustedUrl } : prev);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo');
    }
  };

  const handleProfilePhotoRemoved = async () => {
    try {
      await userService.removeProfilePhoto();
      // Update local state immediately
      setUser(prev => prev ? { ...prev, profile_image: null } : prev);
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
                  {tag.verified ? (
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

      {/* User Metrics Display */}
      {metrics && (
        <View style={[styles.metricsContainer, { backgroundColor: `${theme.primary}10`, borderColor: theme.border }]}>
          <View style={styles.metricsHeader}>
            <Icon name="human-male-height" size={20} color={theme.primary} />
            <Text style={[textStyles.heading4, { color: theme.text, marginLeft: SPACING.xs }]}>
              {t('profile.yourMetrics')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowMetricsModal(true)}
              style={styles.editMetricsButton}
            >
              <Icon name="pencil" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('metrics.height')}</Text>
              <Text style={[textStyles.heading4, { color: theme.text }]}>
                {metrics.height} {t('metrics.cm')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('metrics.weight')}</Text>
              <Text style={[textStyles.heading4, { color: theme.text }]}>
                {metrics.weight} {t('metrics.kg')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('metrics.age')}</Text>
              <Text style={[textStyles.heading4, { color: theme.text }]}>
                {metrics.age} {t('metrics.yrs')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('metrics.gender')}</Text>
              <Text style={[textStyles.heading4, { color: theme.text }]}>
                {metrics.gender === 'M' ? t('metrics.male') : t('metrics.female')}
              </Text>
            </View>
          </View>
          {metrics.bmr && metrics.tdee && (
            <View style={[styles.calculatedMetrics, { borderTopColor: theme.border }]}>
              <View style={styles.calculatedHeader}>
                <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
                  {t('profile.calculatedValues')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowInfoModal(true)}
                  style={styles.infoButton}
                >
                  <Icon name="information-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.calculatedRow}>
                <View style={styles.calculatedItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('nutrition.bmr')}</Text>
                  <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                    {Math.round(metrics.bmr)} {t('metrics.kcal')}
                  </Text>
                </View>
                <View style={styles.calculatedItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{t('nutrition.tdee')}</Text>
                  <Text style={[textStyles.body, { color: theme.success, fontWeight: '600' }]}>
                    {Math.round(metrics.tdee)} {t('metrics.kcal')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.primary }]}>
            {user?.tags?.length || 0}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {t('profile.professionTags')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.success }]}>
            {user?.badges?.length || 0}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {t('profile.badges')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[textStyles.heading4, { color: theme.warning }]}>
            {(user?.allergens?.length || 0) + (user?.custom_allergens?.length || 0)}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {t('profile.allergens')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSectionItem = ({ item }: { item: ProfileSection }) => (
    <TouchableOpacity
      style={[styles.sectionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => handleNavigateToSection(item)}
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
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, textStyles.heading3]}>{t('profile.myProfile')}</Text>
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

      {/* User Metrics Modal */}
      <UserMetricsModal
        visible={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
        onSave={handleMetricsSaved}
        initialMetrics={metrics || undefined}
      />

      {/* BMR/TDEE Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.infoModalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.infoModalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[textStyles.heading3, { color: theme.text }]}>
                Understanding BMR & TDEE
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.infoModalBody} showsVerticalScrollIndicator={false}>
              {/* BMR Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoSectionHeader}>
                  <Icon name="fire" size={24} color={theme.primary} />
                  <Text style={[textStyles.heading4, { color: theme.text, marginLeft: SPACING.sm }]}>
                    BMR (Basal Metabolic Rate)
                  </Text>
                </View>
                <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.sm }]}>
                  BMR is the number of calories your body burns at rest to maintain basic physiological functions like breathing, circulation, and cell production. It represents the minimum energy needed to keep you alive.
                </Text>
                <View style={[styles.formulaBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.xs }]}>
                    Calculation Formula (Mifflin-St Jeor Equation):
                  </Text>
                  <Text style={[textStyles.body, { color: theme.text, fontFamily: 'monospace' }]}>
                    Base = (10 × weight) + (6.25 × height) - (5 × age)
                  </Text>
                  <Text style={[textStyles.body, { color: theme.text, fontFamily: 'monospace', marginTop: SPACING.xs }]}>
                    Male: BMR = Base + 5
                  </Text>
                  <Text style={[textStyles.body, { color: theme.text, fontFamily: 'monospace' }]}>
                    Female: BMR = Base - 161
                  </Text>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' }]}>
                    Weight in kg, Height in cm, Age in years
                  </Text>
                </View>
              </View>

              {/* TDEE Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoSectionHeader}>
                  <Icon name="run" size={24} color={theme.success} />
                  <Text style={[textStyles.heading4, { color: theme.text, marginLeft: SPACING.sm }]}>
                    TDEE (Total Daily Energy Expenditure)
                  </Text>
                </View>
                <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.sm }]}>
                  TDEE is the total number of calories you burn per day, including BMR plus all physical activity. This is the amount of calories you need to maintain your current weight.
                </Text>
                <View style={[styles.formulaBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.xs }]}>
                    Calculation Formula:
                  </Text>
                  <Text style={[textStyles.body, { color: theme.text, fontFamily: 'monospace' }]}>
                    TDEE = BMR × Activity Multiplier
                  </Text>
                  <View style={styles.activityLevelsList}>
                    <Text style={[textStyles.caption, { color: theme.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.xs }]}>
                      Activity Multipliers:
                    </Text>
                    <View style={styles.activityLevelItem}>
                      <Text style={[textStyles.body, { color: theme.text }]}>
                        <Text style={{ fontWeight: '600' }}>Sedentary:</Text> 1.2 (little or no exercise)
                      </Text>
                    </View>
                    <View style={styles.activityLevelItem}>
                      <Text style={[textStyles.body, { color: theme.text }]}>
                        <Text style={{ fontWeight: '600' }}>Light:</Text> 1.375 (exercise 1-3 days/week)
                      </Text>
                    </View>
                    <View style={styles.activityLevelItem}>
                      <Text style={[textStyles.body, { color: theme.text }]}>
                        <Text style={{ fontWeight: '600' }}>Moderate:</Text> 1.55 (exercise 3-5 days/week)
                      </Text>
                    </View>
                    <View style={styles.activityLevelItem}>
                      <Text style={[textStyles.body, { color: theme.text }]}>
                        <Text style={{ fontWeight: '600' }}>Active:</Text> 1.725 (exercise 6-7 days/week)
                      </Text>
                    </View>
                    <View style={styles.activityLevelItem}>
                      <Text style={[textStyles.body, { color: theme.text }]}>
                        <Text style={{ fontWeight: '600' }}>Very Active:</Text> 1.9 (very hard exercise & physical job)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Usage Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoSectionHeader}>
                  <Icon name="lightbulb-on" size={24} color={theme.warning} />
                  <Text style={[textStyles.heading4, { color: theme.text, marginLeft: SPACING.sm }]}>
                    How We Use These Values
                  </Text>
                </View>
                <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.sm }]}>
                  Your TDEE is used to calculate your daily nutrition targets. To maintain your current weight, aim to consume calories equal to your TDEE. To lose weight, consume fewer calories; to gain weight, consume more.
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.infoModalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.closeInfoButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={[textStyles.button, { color: '#fff' }]}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  metricsContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  editMetricsButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: SPACING.sm,
  },
  calculatedMetrics: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  calculatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoButton: {
    padding: SPACING.xs,
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calculatedItem: {
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  infoModalBody: {
    padding: SPACING.md,
    maxHeight: 500,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  formulaBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  activityLevelsList: {
    marginTop: SPACING.xs,
  },
  activityLevelItem: {
    marginTop: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  infoModalFooter: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  closeInfoButton: {
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileSettingsScreen;
