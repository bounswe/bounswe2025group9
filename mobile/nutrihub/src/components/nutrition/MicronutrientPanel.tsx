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
  const [expandedCategory, setExpandedCategory] = useState<'vitamin' | 'mineral' | null>('vitamin');
  const [showAllVitamins, setShowAllVitamins] = useState(false);
  const [showAllMinerals, setShowAllMinerals] = useState(false);

  const vitamins = micronutrients.filter(m => m.category === 'vitamin');
  const minerals = micronutrients.filter(m => m.category === 'mineral');

  const displayedVitamins = showAllVitamins ? vitamins : vitamins.slice(0, 5);
  const displayedMinerals = showAllMinerals ? minerals : minerals.slice(0, 5);

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
        style={[styles.nutrientRow, { backgroundColor: `${theme.surface}99` }]}
      >
        <View style={styles.nutrientHeader}>
          <View style={styles.nutrientInfo}>
            <Icon name="pill" size={16} color={theme.textSecondary} />
            <Text style={[textStyles.body, { color: theme.text, fontWeight: '500', marginLeft: SPACING.xs }]}>
              {nutrient.name}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            {status === 'complete' && !isOverMax && (
              <Icon name="check-circle" size={16} color={color} />
            )}
            {isOverMax && (
              <Icon name="alert-circle" size={16} color={color} />
            )}
            <Text style={[textStyles.caption, { color, fontWeight: '600', marginLeft: SPACING.xs }]}>
              {label}
            </Text>
          </View>
        </View>

        <View style={styles.nutrientValues}>
          <Text style={[textStyles.body, { color: theme.primary, fontWeight: 'bold' }]}>
            {nutrient.current}{nutrient.unit}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            / {nutrient.target}{nutrient.unit}
          </Text>
          {nutrient.maximum && (
            <Text style={[textStyles.caption, { color: theme.textSecondary, opacity: 0.7 }]}>
              (max: {nutrient.maximum}{nutrient.unit})
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
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
          style={[styles.sectionHeader, { backgroundColor: `${theme.primary}10` }]}
          onPress={() => setExpandedCategory(expandedCategory === 'vitamin' ? null : 'vitamin')}
        >
          <Text style={[textStyles.heading4, { color: theme.text }]}>Vitamins</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {vitamins.filter(v => (v.current / v.target) * 100 >= 100).length} / {vitamins.length} met
            </Text>
            <Icon 
              name={expandedCategory === 'vitamin' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </View>
        </TouchableOpacity>

        {expandedCategory === 'vitamin' && (
          <View style={styles.nutrientList}>
            {displayedVitamins.map(renderNutrientRow)}
            
            {vitamins.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllVitamins(!showAllVitamins)}
              >
                <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                  {showAllVitamins ? 'Show Less' : `Show ${vitamins.length - 5} More`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Minerals Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: `${theme.primary}10` }]}
          onPress={() => setExpandedCategory(expandedCategory === 'mineral' ? null : 'mineral')}
        >
          <Text style={[textStyles.heading4, { color: theme.text }]}>Minerals</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {minerals.filter(m => (m.current / m.target) * 100 >= 100).length} / {minerals.length} met
            </Text>
            <Icon 
              name={expandedCategory === 'mineral' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </View>
        </TouchableOpacity>

        {expandedCategory === 'mineral' && (
          <View style={styles.nutrientList}>
            {displayedMinerals.map(renderNutrientRow)}
            
            {minerals.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllMinerals(!showAllMinerals)}
              >
                <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                  {showAllMinerals ? 'Show Less' : `Show ${minerals.length - 5} More`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Warning Box */}
      <View style={[styles.warningBox, { backgroundColor: `${theme.warning}20`, borderColor: theme.warning }]}>
        <Icon name="alert-circle" size={20} color={theme.warning} />
        <View style={styles.warningContent}>
          <Text style={[textStyles.caption, { color: theme.text, fontWeight: '600' }]}>
            Important Note:
          </Text>
          <Text style={[textStyles.caption, { color: theme.text }]}>
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
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nutrientList: {
    marginTop: SPACING.sm,
  },
  nutrientRow: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  nutrientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
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
  showMoreButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  warningContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
});

export default MicronutrientPanel;

