import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
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
  const [selectedNutrient, setSelectedNutrient] = useState<MicroNutrient | null>(null);

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

  const getDetailedMicronutrientInfo = (nutrient: MicroNutrient) => {
    const percentage = Math.round((nutrient.current / nutrient.target) * 100);
    const isOverMax = nutrient.maximum && nutrient.current > nutrient.maximum;
    
    if (isOverMax && nutrient.maximum) {
      const overAmount = (nutrient.current - nutrient.maximum).toFixed(1);
      const overPercentage = Math.round(((nutrient.current - nutrient.maximum) / nutrient.maximum) * 100);
      return {
        title: `${nutrient.name} - Exceeds Maximum`,
        message: `You've consumed ${nutrient.current.toFixed(1)}${nutrient.unit}, which exceeds the recommended maximum of ${nutrient.maximum.toFixed(1)}${nutrient.unit} by ${overAmount}${nutrient.unit} (${overPercentage}% over).\n\nExceeding the maximum intake for ${nutrient.name} may have health implications. Consider reducing your intake from foods high in this nutrient for the rest of the day.`,
        recommendation: `Recommended maximum: ${nutrient.maximum.toFixed(1)}${nutrient.unit}`,
        icon: 'alert-circle',
        color: theme.error,
      };
    }
    
    if (percentage >= 100) {
      return {
        title: `${nutrient.name} - Target Met! 🎉`,
        message: `Excellent! You've reached ${nutrient.current.toFixed(1)}${nutrient.unit} of your ${nutrient.target.toFixed(1)}${nutrient.unit} daily target (${percentage}%).\n\nYou're getting adequate ${nutrient.name} for optimal health. ${nutrient.maximum ? `Just be mindful not to exceed ${nutrient.maximum.toFixed(1)}${nutrient.unit} maximum.` : 'Keep up the good work!'}`,
        recommendation: nutrient.maximum ? `Maximum recommended: ${nutrient.maximum.toFixed(1)}${nutrient.unit}` : 'Keep maintaining this level',
        icon: 'check-circle',
        color: theme.success,
      };
    }
    
    if (percentage >= 75) {
      const remaining = (nutrient.target - nutrient.current).toFixed(1);
      return {
        title: `${nutrient.name} - Good Progress (${percentage}%)`,
        message: `You're doing well with ${nutrient.current.toFixed(1)}${nutrient.unit} consumed so far. You need just ${remaining}${nutrient.unit} more to reach your ${nutrient.target.toFixed(1)}${nutrient.unit} daily target.\n\nYou're on the right track! A little more and you'll meet your daily requirement.`,
        recommendation: `Target: ${nutrient.target.toFixed(1)}${nutrient.unit}`,
        icon: 'check',
        color: '#22c55e',
      };
    }
    
    if (percentage >= 50) {
      const remaining = (nutrient.target - nutrient.current).toFixed(1);
      return {
        title: `${nutrient.name} - Fair Progress (${percentage}%)`,
        message: `You've consumed ${nutrient.current.toFixed(1)}${nutrient.unit}, which is about halfway to your ${nutrient.target.toFixed(1)}${nutrient.unit} target. You still need ${remaining}${nutrient.unit} more.\n\nConsider adding foods rich in ${nutrient.name} to your remaining meals today to meet your daily requirement.`,
        recommendation: `Target: ${nutrient.target.toFixed(1)}${nutrient.unit}`,
        icon: 'alert',
        color: theme.warning,
      };
    }
    
    const remaining = (nutrient.target - nutrient.current).toFixed(1);
    return {
      title: `${nutrient.name} - Low (${percentage}%)`,
      message: `You've only consumed ${nutrient.current.toFixed(1)}${nutrient.unit} of your ${nutrient.target.toFixed(1)}${nutrient.unit} daily target. You need ${remaining}${nutrient.unit} more.\n\nThis is significantly below your daily requirement. Try to incorporate foods rich in ${nutrient.name} in your remaining meals today. Deficiency in ${nutrient.name} may affect your health.`,
      recommendation: `Target: ${nutrient.target.toFixed(1)}${nutrient.unit}`,
      icon: 'close-circle',
      color: theme.error,
    };
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
          <TouchableOpacity 
            style={styles.statusBadge}
            onPress={() => setSelectedNutrient(nutrient)}
            activeOpacity={0.7}
          >
            {status === 'complete' && !isOverMax && (
              <Icon name="check-circle" size={16} color={color} style={{ marginRight: 4 }} />
            )}
            {isOverMax && (
              <Icon name="alert-circle" size={16} color={color} style={{ marginRight: 4 }} />
            )}
            <Text style={[textStyles.caption, { color, fontWeight: '700' }]}>
              {label}
            </Text>
          </TouchableOpacity>
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

      {/* Info Modal */}
      {selectedNutrient && (
        <Modal
          visible={selectedNutrient !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedNutrient(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <View style={[
                  styles.modalIconContainer, 
                  { 
                    backgroundColor: theme.surface,
                    borderColor: `${getDetailedMicronutrientInfo(selectedNutrient).color}50`,
                    borderWidth: 1,
                  }
                ]}>
                  <Icon 
                    name={getDetailedMicronutrientInfo(selectedNutrient).icon} 
                    size={24} 
                    color={getDetailedMicronutrientInfo(selectedNutrient).color} 
                  />
                </View>
                <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.md, flex: 1 }]}>
                  {getDetailedMicronutrientInfo(selectedNutrient).title}
                </Text>
              </View>
              
              <Text style={[textStyles.body, { color: theme.textSecondary, lineHeight: 22, marginTop: SPACING.md }]}>
                {getDetailedMicronutrientInfo(selectedNutrient).message}
              </Text>
              
              {getDetailedMicronutrientInfo(selectedNutrient).recommendation && (
                <View style={[styles.recommendationBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Icon name="information" size={16} color={theme.primary} style={{ marginRight: SPACING.xs }} />
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                    {getDetailedMicronutrientInfo(selectedNutrient).recommendation}
                  </Text>
                </View>
              )}

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Current</Text>
                  <Text style={[textStyles.heading4, { color: theme.primary }]}>
                    {selectedNutrient.current.toFixed(1)}{selectedNutrient.unit}
                  </Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Target</Text>
                  <Text style={[textStyles.heading4, { color: theme.text }]}>
                    {selectedNutrient.target.toFixed(1)}{selectedNutrient.unit}
                  </Text>
                </View>
                {selectedNutrient.maximum && (
                  <View style={styles.modalStatItem}>
                    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Maximum</Text>
                    <Text style={[textStyles.heading4, { color: theme.error }]}>
                      {selectedNutrient.maximum.toFixed(1)}{selectedNutrient.unit}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setSelectedNutrient(null)}
                activeOpacity={0.8}
              >
                <Text style={[textStyles.body, { color: '#fff', fontWeight: '700' }]}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
});

export default MicronutrientPanel;

