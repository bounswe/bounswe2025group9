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
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { AccountWarning } from '../../types/types';

const AccountWarningsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [warnings, setWarnings] = useState<AccountWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // Load user's account warnings on mount
  useEffect(() => {
    loadAccountWarnings();
  }, []);

  const loadAccountWarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const warningsData = await userService.getAccountWarnings();
      // setWarnings(warningsData);
      
      // Mock data for now
      const mockWarnings: AccountWarning[] = [
        {
          id: 1,
          type: 'warning',
          reason: 'Inappropriate Content',
          description: 'Your post "Quick Nutrition Tips" contained misleading information about supplements. Please ensure all health claims are backed by credible sources.',
          issued_at: new Date('2024-01-15T10:00:00Z'),
          expires_at: new Date('2024-02-15T10:00:00Z'),
          issued_by: 'Community Moderator',
          is_active: true
        },
        {
          id: 2,
          type: 'post_removal',
          reason: 'Violation of Community Guidelines',
          description: 'Your post "Best Diet for Weight Loss" was removed because it contained unverified medical claims and potentially harmful advice.',
          issued_at: new Date('2024-01-10T14:30:00Z'),
          issued_by: 'Community Moderator',
          is_active: true
        },
        {
          id: 3,
          type: 'warning',
          reason: 'Spam Behavior',
          description: 'Multiple reports of spam-like behavior in forum posts. Please ensure your contributions are meaningful and relevant to the community.',
          issued_at: new Date('2023-12-20T09:15:00Z'),
          expires_at: new Date('2024-01-20T09:15:00Z'),
          issued_by: 'System Administrator',
          is_active: false
        },
        {
          id: 4,
          type: 'suspension',
          reason: 'Repeated Violations',
          description: 'Your account has been suspended for 7 days due to repeated violations of community guidelines. Please review our terms of service.',
          issued_at: new Date('2023-11-15T16:45:00Z'),
          expires_at: new Date('2023-11-22T16:45:00Z'),
          issued_by: 'Community Manager',
          is_active: false
        }
      ];
      
      setWarnings(mockWarnings);
    } catch (err) {
      console.error('Error loading account warnings:', err);
      setError('Failed to load account warnings');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const getFilteredWarnings = () => {
    switch (filter) {
      case 'active':
        return warnings.filter(warning => warning.is_active);
      case 'resolved':
        return warnings.filter(warning => !warning.is_active);
      default:
        return warnings;
    }
  };

  const getWarningIcon = (type: AccountWarning['type']) => {
    switch (type) {
      case 'warning':
        return 'alert-circle';
      case 'post_removal':
        return 'delete-circle';
      case 'ban':
        return 'account-cancel';
      case 'suspension':
        return 'clock-alert';
      default:
        return 'alert';
    }
  };

  const getWarningColor = (type: AccountWarning['type'], isActive: boolean) => {
    if (!isActive) return theme.textSecondary;
    
    switch (type) {
      case 'warning':
        return theme.warning;
      case 'post_removal':
        return theme.error;
      case 'ban':
        return theme.error;
      case 'suspension':
        return theme.warning;
      default:
        return theme.text;
    }
  };

  const getWarningTitle = (type: AccountWarning['type']) => {
    switch (type) {
      case 'warning':
        return 'Warning';
      case 'post_removal':
        return 'Post Removed';
      case 'ban':
        return 'Account Banned';
      case 'suspension':
        return 'Account Suspended';
      default:
        return 'Account Action';
    }
  };

  const renderFilterButton = (filterType: typeof filter, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === filterType ? theme.primary : theme.surface,
          borderColor: filter === filterType ? theme.primary : theme.border,
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        textStyles.body,
        { color: filter === filterType ? '#fff' : theme.text, fontWeight: '600' }
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderWarningItem = ({ item }: { item: AccountWarning }) => {
    const iconName = getWarningIcon(item.type);
    const iconColor = getWarningColor(item.type, item.is_active);
    const title = getWarningTitle(item.type);
    
    return (
      <View style={[styles.warningCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.warningHeader}>
          <View style={styles.warningIconContainer}>
            <Icon name={iconName as any} size={24} color={iconColor} />
          </View>
          <View style={styles.warningInfo}>
            <Text style={[textStyles.subtitle, { color: theme.text }]}>
              {title}
            </Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.reason}
            </Text>
          </View>
          <View style={styles.warningStatus}>
            {item.is_active ? (
              <View style={[styles.activeBadge, { backgroundColor: theme.error }]}>
                <Text style={[textStyles.small, { color: '#fff' }]}>Active</Text>
              </View>
            ) : (
              <View style={[styles.resolvedBadge, { backgroundColor: theme.success }]}>
                <Text style={[textStyles.small, { color: '#fff' }]}>Resolved</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.warningContent}>
          <Text style={[textStyles.body, { color: theme.text }]}>
            {item.description}
          </Text>
        </View>

        <View style={styles.warningFooter}>
          <View style={styles.warningMeta}>
            <Icon name="calendar" size={14} color={theme.textSecondary} />
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.issued_at.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.warningMeta}>
            <Icon name="account" size={14} color={theme.textSecondary} />
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.issued_by}
            </Text>
          </View>
          {item.expires_at && (
            <View style={styles.warningMeta}>
              <Icon name="clock" size={14} color={theme.textSecondary} />
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                Expires: {item.expires_at.toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="check-circle" size={64} color={theme.success} />
      <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
        No Account Actions
      </Text>
      <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
        Great! You have no warnings, post removals, bans, or suspensions on your account.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading account warnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
            Error Loading Warnings
          </Text>
          <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadAccountWarnings}
          >
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredWarnings = getFilteredWarnings();
  const activeCount = warnings.filter(w => w.is_active).length;
  const resolvedCount = warnings.filter(w => !w.is_active).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Account Warnings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Buttons */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.filterButtons}>
          {renderFilterButton('all', 'All', warnings.length)}
          {renderFilterButton('active', 'Active', activeCount)}
          {renderFilterButton('resolved', 'Resolved', resolvedCount)}
        </View>
      </View>

      {/* Warnings List */}
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={filteredWarnings}
        renderItem={renderWarningItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  warningCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  warningIconContainer: {
    marginRight: SPACING.md,
    marginTop: SPACING.xs,
  },
  warningInfo: {
    flex: 1,
  },
  warningStatus: {
    marginLeft: SPACING.sm,
  },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  resolvedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  warningContent: {
    marginBottom: SPACING.sm,
  },
  warningFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  warningMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  separator: {
    height: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
});

export default AccountWarningsScreen;
