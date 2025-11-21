/**
 * FollowingListScreen
 * 
 * Displays a list of users that a specific user is following.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ForumStackParamList } from '../../navigation/types';
import { User } from '../../types/types';
import { userService } from '../../services/api/user.service';
import { useAuth } from '../../context/AuthContext';

type FollowingListNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'FollowingList'>;
type FollowingListRouteProp = RouteProp<ForumStackParamList, 'FollowingList'>;

/**
 * Following list screen component
 */
const FollowingListScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<FollowingListNavigationProp>();
  const route = useRoute<FollowingListRouteProp>();
  const { username } = route.params;
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch following from API
   */
  useEffect(() => {
    const fetchFollowing = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await userService.getFollowing(username);
        setFollowing(data);
      } catch (err) {
        console.error('Error fetching following:', err);
        setError('Failed to load following. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [username]);

  /**
   * Navigate to user profile
   */
  const handleUserPress = (user: User) => {
    if (currentUser && user.username === currentUser.username) {
      // Navigate back if it's the current user
      navigation.goBack();
      return;
    }
    navigation.push('UserProfile', { username: user.username, userId: user.id });
  };

  /**
   * Render user item
   */
  const renderUserItem = ({ item }: { item: User }) => {
    const displayName = item.name || item.surname
      ? `${item.name || ''} ${item.surname || ''}`.trim()
      : item.username;

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.surface }]}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        {/* Profile Image */}
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Icon name="account" size={28} color={theme.buttonText} />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[textStyles.subtitle, { color: theme.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]} numberOfLines={1}>
            @{item.username}
          </Text>
        </View>

        {/* Arrow Icon */}
        <Icon name="chevron-right" size={24} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="account-group-outline" size={64} color={theme.textSecondary} />
      <Text style={[textStyles.h3, styles.emptyTitle, { color: theme.text }]}>
        Not Following Anyone
      </Text>
      <Text style={[textStyles.body, styles.emptyText, { color: theme.textSecondary }]}>
        {username} is not following anyone yet.
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={64} color={theme.error} />
      <Text style={[textStyles.h3, styles.errorTitle, { color: theme.text }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => {
          setLoading(true);
          setError(null);
          userService
            .getFollowing(username)
            .then(setFollowing)
            .catch(() => setError('Failed to load following.'))
            .finally(() => setLoading(false));
        }}
      >
        <Text style={[textStyles.buttonText, { color: theme.buttonText }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Main render
   */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[textStyles.h2, styles.headerTitle, { color: theme.text }]}>
            Following
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            @{username}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={[
            styles.listContent,
            following.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
});

export default FollowingListScreen;

