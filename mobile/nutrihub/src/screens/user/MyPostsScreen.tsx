import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  screen: string;
  badge?: string;
  badgeColor?: string;
}

const MyPostsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<any>();

  const profileSections: ProfileSection[] = [
    {
      id: 'my-posts',
      title: 'My Forum Posts',
      description: 'View and manage your forum posts',
      icon: 'post',
      screen: 'MyPosts'
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
      id: 'personal-recipes',
      title: 'Personal Recipes',
      description: 'View and manage your personal recipe collection',
      icon: 'chef-hat',
      screen: 'PersonalRecipes'
    }
  ];

  const handleNavigateToSection = (screen: string) => {
    // Navigate to the specific screen
    navigation.navigate(screen as any);
  };


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


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, textStyles.heading3]}>My Content</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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

export default MyPostsScreen;
