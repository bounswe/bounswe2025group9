import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { getFoodProposals, FoodProposalStatus } from '../../services/api/food.service';

type StatusKind = 'pending' | 'approved' | 'rejected';

const getStatusInfo = (proposal: FoodProposalStatus): { label: string; kind: StatusKind } => {
  if (proposal.isApproved === true) return { label: 'Approved', kind: 'approved' };
  if (proposal.isApproved === false) return { label: 'Rejected', kind: 'rejected' };
  return { label: 'Pending review', kind: 'pending' };
};

const FoodProposalsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();
  const [proposals, setProposals] = useState<FoodProposalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProposals = async () => {
    try {
      const data = await getFoodProposals();
      setProposals(data);
    } catch (error) {
      console.error('Failed to load food proposals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProposals();
    }, [])
  );

  const renderStatusBadge = (proposal: FoodProposalStatus) => {
    const { label, kind } = getStatusInfo(proposal);
    const palette = {
      approved: { bg: `${theme.success}20`, text: theme.success },
      rejected: { bg: `${theme.error}20`, text: theme.error },
      pending: { bg: `${theme.warning}20`, text: theme.warning },
    }[kind];

    return (
      <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.text }]}>
        <Text style={[textStyles.small, { color: palette.text, fontWeight: '600' }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: FoodProposalStatus }) => {
    const createdDate = new Date(item.createdAt);
    const dateText = isNaN(createdDate.getTime())
      ? ''
      : createdDate.toLocaleDateString();

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
            <Icon name="food" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.category} • {item.servingSize}g {dateText ? `• ${dateText}` : ''}
            </Text>
          </View>
        </View>
        {renderStatusBadge(item)}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.empty, { borderColor: theme.border }]}>
      <Text style={[textStyles.body, { color: theme.textSecondary }]}>
        No food proposals yet.
      </Text>
      <Text style={[textStyles.caption, { color: theme.textSecondary, marginTop: 4 }]}>
        Submit a proposal from the Foods tab to see it here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderColor: theme.border }]}
        >
          <Icon name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.heading2, { color: theme.text }]}>My Food Proposals</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Track pending, approved, or rejected proposals
          </Text>
        </View>
      </View>

      <FlatList
        data={proposals}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SPACING.xl },
          proposals.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProposals();
            }}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FoodProposalsScreen;

