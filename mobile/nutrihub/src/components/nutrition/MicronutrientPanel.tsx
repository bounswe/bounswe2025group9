import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MicroNutrient } from '../../types/nutrition';

interface MicronutrientPanelProps {
  micronutrients: MicroNutrient[];
}

const MicronutrientPanel: React.FC<MicronutrientPanelProps> = ({ micronutrients }) => {
  const { theme, textStyles } = useTheme();
  const [isVitaminsExpanded, setIsVitaminsExpanded] = useState(true);
  const [isMineralsExpanded, setIsMineralsExpanded] = useState(true);

  // Format numbers to 1 decimal place
  const formatNumber = (num: number): string => {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  const vitamins = micronutrients.filter(m => m.category === 'vitamin');
  const minerals = micronutrients.filter(m => m.category === 'mineral');

  const getNutrientStatus = (nutrient: MicroNutrient) => {
    const percentage = (nutrient.current / nutrient.target) * 100;
    
    if (nutrient.maximum && nutrient.current > nutrient.maximum) {
      return { status: 'danger', color: theme.error, label: 'Over Maximum' };
    }
    if (percentage >= 100) {
      return { status: 'complete', color: theme.success, label: 'Met' };
    }
    if (percentage >= 75) {
      return { status: 'good', color: '#22c55e', label: 'Good' };
    }
    if (percentage >= 50) {
      return { status: 'fair', color: theme.warning, label: 'Fair' };
    }
    return { status: 'low', color: theme.error, label: 'Low' };
  };

  const renderNutrientRow = (nutrient: MicroNutrient) => {
    const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100);
    const { status, color, label } = getNutrientStatus(nutrient);
    const isOverMax = nutrient.maximum && nutrient.current > nutrient.maximum;

    return (
      <View 
        key={nutrient.name} 
        style={[styles.nutrientRow, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
      >
        <View style={styles.nutrientHeader}>
          <View style={styles.nutrientInfo}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: `${theme.primary}40`, borderWidth: 1, width: 28, height: 28, borderRadius: BORDER_RADIUS.sm, marginRight: SPACING.sm }]}>
              <Icon name="pill" size={14} color={theme.primary} />
            </View>
            <Text style={[textStyles.body, { color: theme.text, fontWeight: '500' }]}>
              {nutrient.name}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            {status === 'complete' && !isOverMax && (
              <Icon name="check-circle" size={16} color={color} style={{ marginRight: 4 }} />
            )}
            {isOverMax && (
              <Icon name="alert-circle" size={16} color={color} style={{ marginRight: 4 }} />
            )}
            <Text style={[textStyles.caption, { color, fontWeight: '700' }]}>
              {label}
            </Text>
          </View>
        </View>

        <View style={styles.nutrientValues}>
          <Text style={[textStyles.body, { color: theme.primary, fontWeight: 'bold' }]}>
            {formatNumber(nutrient.current)}{nutrient.unit}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            / {formatNumber(nutrient.target)}{nutrient.unit}
          </Text>
          {nutrient.maximum && (
            <Text style={[textStyles.caption, { color: theme.textSecondary, opacity: 0.7 }]}>
              (max: {formatNumber(nutrient.maximum)}{nutrient.unit})
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: `${theme.primary}10` }]}>
          <View 
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor: color
              }
            ]}
          />
          {/* Warning indicator if over maximum */}
          {isOverMax && (
            <View 
              style={[
                styles.warningIndicator,
                { backgroundColor: theme.error }
              ]}
            />
          )}
        </View>

        {/* Warning message if over maximum */}
        {isOverMax && (
          <Text style={[textStyles.caption, { color: theme.error, marginTop: SPACING.xs }]}>
            ⚠️ Exceeds safe maximum threshold
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.panelHeader}>
        <Icon name="pill" size={28} color={theme.primary} />
        <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm }]}>
          Micronutrients
        </Text>
      </View>

      {/* Vitamins Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setIsVitaminsExpanded(!isVitaminsExpanded)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: '#ec489950', borderWidth: 1 }]}>
              <Icon name="pill" size={20} color="#ec4899" />
            </View>
            <Text style={[textStyles.heading4, { color: theme.text }]}>Vitamins</Text>
          </View>
          
          <View style={styles.sectionHeaderRight}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {vitamins.filter(v => (v.current / v.target) * 100 >= 100).length} / {vitamins.length} met
            </Text>
            <Icon 
              name={isVitaminsExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </View>
        </TouchableOpacity>

        {isVitaminsExpanded && (
          <View style={styles.nutrientList}>
             {vitamins.map(renderNutrientRow)}
          </View>
        )}
      </View>

      {/* Minerals Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setIsMineralsExpanded(!isMineralsExpanded)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: '#6366f150', borderWidth: 1 }]}>
              <Icon name="diamond-stone" size={20} color="#6366f1" />
            </View>
            <Text style={[textStyles.heading4, { color: theme.text }]}>Minerals</Text>
          </View>

          <View style={styles.sectionHeaderRight}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {minerals.filter(m => (m.current / m.target) * 100 >= 100).length} / {minerals.length} met
            </Text>
            <Icon 
              name={isMineralsExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </View>
        </TouchableOpacity>

        {isMineralsExpanded && (
          <View style={styles.nutrientList}>
             {minerals.map(renderNutrientRow)}
          </View>
        )}
      </View>

      {/* Warning Box */}
      <View style={[styles.warningBox, { backgroundColor: '#FFF7EB', borderLeftColor: theme.warning }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: `${theme.warning}50`, borderWidth: 1, width: 40, height: 40, borderRadius: BORDER_RADIUS.full }]}>
          <Icon name="alert" size={20} color={theme.warning} />
        </View>
        <View style={styles.warningContent}>
          <Text style={[textStyles.caption, { color: theme.text, fontWeight: '700', marginBottom: 2 }]}>
            Important Note
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, lineHeight: 18 }]}>
            Some micronutrients have maximum safe limits. Exceeding these limits may be harmful to your health. 
            Consult with a healthcare professional if you consistently exceed maximum thresholds.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  nutrientList: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  nutrientRow: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  nutrientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  warningIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: BORDER_RADIUS.full,
    borderBottomRightRadius: BORDER_RADIUS.full,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  warningContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
});

export default MicronutrientPanel;

