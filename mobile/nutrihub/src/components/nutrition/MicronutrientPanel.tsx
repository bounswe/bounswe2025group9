import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MicroNutrient } from '../../types/nutrition';

interface MicronutrientPanelProps {
  micronutrients: MicroNutrient[];
}

const CircularProgress = ({
  percentage,
  color,
  size = 60,
  strokeWidth = 5,
  children
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) * circumference) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeOpacity={0.15}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      {children}
    </View>
  );
};

const MicronutrientPanel: React.FC<MicronutrientPanelProps> = ({ micronutrients }) => {
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  const [isVitaminsExpanded, setIsVitaminsExpanded] = useState(true);
  const [isMineralsExpanded, setIsMineralsExpanded] = useState(true);
  const [selectedNutrient, setSelectedNutrient] = useState<MicroNutrient | null>(null);

  // Format numbers to 1 decimal place
  const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) return '0';
    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
  };

  const vitamins = micronutrients.filter(m => m.category === 'vitamin');
  const minerals = micronutrients.filter(m => m.category === 'mineral');

  const getNutrientStatus = (nutrient: MicroNutrient) => {
    // If target is 0, we can't calculate percentage. Treat as "info" or 0%
    if (nutrient.target === 0) {
      return { status: 'info', color: theme.textSecondary, label: 'Recorded' };
    }
    const percentage = (nutrient.current / nutrient.target) * 100;

    if (nutrient.maximum && nutrient.current > nutrient.maximum) {
      return { status: 'danger', color: theme.error, label: 'Max Exceeded' };
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

  const renderNutrientCircle = (nutrient: MicroNutrient) => {
    const hasTarget = nutrient.target > 0;
    const percentage = hasTarget ? Math.min((nutrient.current / nutrient.target) * 100, 100) : 0;
    const { color, status } = getNutrientStatus(nutrient);
    const isOverMax = nutrient.maximum && nutrient.current > nutrient.maximum;
    const displayColor = isOverMax ? theme.error : (hasTarget ? color : theme.primary);
    const isMet = percentage >= 100 && !isOverMax;

    return (
      <TouchableOpacity
        key={nutrient.name}
        style={styles.circleItem}
        onPress={() => setSelectedNutrient(nutrient)}
        activeOpacity={0.7}
      >
        <CircularProgress percentage={percentage} color={displayColor} size={64} strokeWidth={5}>
          <View style={{ alignItems: 'center' }}>
            {hasTarget ? (
              isMet ? (
                <Icon name="check-bold" size={24} color={displayColor} />
              ) : (
                <Text style={[textStyles.caption, { color: displayColor, fontWeight: 'bold', fontSize: 12 }]}>
                  {Math.round(percentage)}%
                </Text>
              )
            ) : (
              <Icon name={nutrient.category === 'vitamin' ? 'pill' : 'cube-outline'} size={24} color={theme.textSecondary} />
            )}
          </View>
        </CircularProgress>

        <View style={styles.circleInfo}>
          <Text
            style={[textStyles.caption, { color: theme.text, textAlign: 'center', fontWeight: '600', marginBottom: 2 }]}
            numberOfLines={1}
          >
            {nutrient.name}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, fontSize: 10 }]}>
            {formatNumber(nutrient.current)}{nutrient.unit}
          </Text>
          {hasTarget && (
            <Text style={[textStyles.caption, { color: theme.textSecondary, fontSize: 9, opacity: 0.7 }]}>
              / {formatNumber(nutrient.target)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, data: MicroNutrient[], isExpanded: boolean, onToggle: () => void, icon: any, color: string) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: `${color}50`, borderWidth: 1 }]}>
            <Icon name={icon} size={20} color={color} />
          </View>
          <Text style={[textStyles.heading4, { color: theme.text }]}>{title}</Text>
        </View>

        <View style={styles.sectionHeaderRight}>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {data.filter(v => v.target > 0 && (v.current / v.target) * 100 >= 100).length} / {data.length} {t('common.met')}
          </Text>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.text} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.gridContainer}>
          {data.map(renderNutrientCircle)}
        </View>
      )}
    </View>
  );

  // Detailed info modal helper (simplified for brevity, reused mostly)
  const getDetailedMicronutrientInfo = (nutrient: MicroNutrient) => {
    const percentage = nutrient.target > 0 ? Math.round((nutrient.current / nutrient.target) * 100) : 0;
    const isOverMax = nutrient.maximum && nutrient.current > nutrient.maximum;
    const remaining = Math.max(0, nutrient.target - nutrient.current);

    // ... Logic similar to before but handling target=0 ...
    if (nutrient.target === 0) {
      return {
        title: `${nutrient.name}`,
        message: `You've consumed ${nutrient.current.toFixed(1)}${nutrient.unit}. No specific target is set for this nutrient.`,
        icon: 'information',
        color: theme.primary
      };
    }

    // Existing status logic ...
    if (isOverMax) return {
      title: `${nutrient.name} - Exceeds Maximum`,
      message: `Limit exceeded.`,
      recommendation: `Max: ${nutrient.maximum}`,
      icon: 'alert-circle', color: theme.error
    };
    if (percentage >= 100) return { title: 'Target Met!', message: 'Great job!', icon: 'check-circle', color: theme.success };
    if (percentage >= 50) return { title: 'Good Progress', message: `${remaining.toFixed(1)} more needed.`, icon: 'trending-up', color: theme.warning };
    return { title: 'Low', message: `You need ${remaining.toFixed(1)} more.`, icon: 'arrow-up', color: theme.error };
  };

  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.panelHeader}>
        <Icon name="pill" size={28} color={theme.primary} />
        <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm }]}>
          {t('nutrition.micronutrients')}
        </Text>
      </View>

      {vitamins.length > 0 && renderSection(t('nutrition.vitamins'), vitamins, isVitaminsExpanded, () => setIsVitaminsExpanded(!isVitaminsExpanded), 'pill', '#ec4899')}
      {minerals.length > 0 && renderSection(t('nutrition.minerals'), minerals, isMineralsExpanded, () => setIsMineralsExpanded(!isMineralsExpanded), 'cube-outline', '#6366f1')}

      {/* Warning Box */}
      <View style={[styles.warningBox, { backgroundColor: '#FFF7EB', borderLeftColor: theme.warning }]}>
        <Icon name="alert" size={20} color={theme.warning} style={{ marginTop: 2 }} />
        <Text style={[textStyles.caption, { color: theme.textSecondary, marginLeft: SPACING.md, flex: 1, lineHeight: 18 }]}>
          {t('nutrition.micronutrientsWarning')}
        </Text>
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
              {/* Simplified Modal Content Reusing styles */}
              <View style={styles.modalHeader}>
                <Text style={[textStyles.heading3, { color: theme.text }]}>{selectedNutrient.name}</Text>
              </View>
              <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: 10 }]}>
                Current: {selectedNutrient.current.toFixed(1)}{selectedNutrient.unit}
              </Text>
              {selectedNutrient.target > 0 && (
                <Text style={[textStyles.body, { color: theme.textSecondary }]}>
                  Target: {selectedNutrient.target.toFixed(1)}{selectedNutrient.unit}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary, marginTop: 20 }]}
                onPress={() => setSelectedNutrient(null)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
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
    elevation: 1,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between', // Changed to utilize space better or 'flex-start'
    paddingHorizontal: SPACING.xs,
  },
  circleItem: {
    width: '30%', // Fits 3 in a row comfortably with gaps
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  circleInfo: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    borderRadius: 20, padding: 20, elevation: 5
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center' },
  modalButton: { padding: 15, borderRadius: 10, alignItems: 'center' }
});

export default MicronutrientPanel;

