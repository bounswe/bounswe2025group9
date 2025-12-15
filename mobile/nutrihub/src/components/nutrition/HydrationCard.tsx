import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface HydrationCardProps {
  current: number;
  target: number;
  penalty?: number | null;
  adjustedScore?: number | null;
}

const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(val)) return '0';
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
};

const HydrationCard: React.FC<HydrationCardProps> = ({ current, target, penalty, adjustedScore }) => {
  const { theme, textStyles } = useTheme();
  const [showInfo, setShowInfo] = useState(false);
  const pct = target > 0 ? Math.min(200, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const ratio = target > 0 ? current / target : 0;
  const status =
    target <= 0
      ? 'Set target'
      : ratio >= 1
        ? 'On target'
        : ratio >= 0.8
          ? 'Slightly low'
          : 'Low';

  const statusColor =
    target <= 0
      ? theme.textSecondary
      : ratio >= 1
        ? theme.success
        : theme.warning || '#f59e0b';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="water-outline" size={22} color={theme.primary} />
          <View>
            <Text style={[textStyles.heading4, { color: theme.text }]}>Hydration</Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              Daily Target: {formatNumber(target)} g
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
          <TouchableOpacity onPress={() => setShowInfo(true)} hitSlop={8}>
            <Icon name="information-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.bigNumber, { color: statusColor }]}>{formatNumber(current)} g</Text>
        <Text style={[styles.percent, { color: statusColor }]}>{pct}%</Text>
      </View>
      <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: 6 }]}>
        Remaining {formatNumber(remaining)} g
      </Text>

      <View style={[styles.progressBackground, { backgroundColor: `${theme.primary}10` }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
              backgroundColor: ratio >= 1 ? theme.success : theme.primary,
            },
          ]}
        />
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.hint, textStyles.bodySecondary]}>
          Score impact: {penalty !== null && penalty !== undefined ? penalty.toFixed(2) : '0.00'} (min -2.00)
        </Text>
        {adjustedScore !== null && adjustedScore !== undefined && (
          <Text style={[styles.hint, textStyles.subtitle]}>Adjusted: {adjustedScore.toFixed(2)}</Text>
        )}
      </View>

      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[textStyles.heading4, { color: theme.text }]}>Hydration target</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)} hitSlop={8}>
                <Icon name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[textStyles.body, { color: theme.text }]}>
              Your daily water target comes from your profile&apos;s nutrition targets
              (Adequate Intake: ~3700 g for males, ~2700 g for females). You can adjust it
              in Nutrition Targets.
            </Text>
            <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.sm }]}>
              The nutrition score loses up to 2.00 points when you are below target.
              Log water by adding foods with “Water (g)” (e.g., plain water) to improve your intake.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
  bigNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  percent: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBackground: {
    height: 10,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
  },
  hint: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
});

export default HydrationCard;
