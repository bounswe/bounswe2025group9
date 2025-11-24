/**
 * FoodFilterModal Component
 * 
 * A modal for filtering food items by category, dietary options, price, and nutrition score.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import { FoodFilters, FoodCategoryType, DietaryOptionType } from '../../types/types';
import { FOOD_CATEGORIES, DIETARY_OPTIONS } from '../../constants/foodConstants';

interface FoodFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FoodFilters;
  onApplyFilters: (filters: FoodFilters) => void;
}

const FoodFilterModal: React.FC<FoodFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const { theme, textStyles } = useTheme();
  const [localFilters, setLocalFilters] = React.useState<FoodFilters>(filters);

  // Reset local filters when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleCategorySelect = (category: FoodCategoryType) => {
    setLocalFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const handleDietaryOptionToggle = (option: DietaryOptionType) => {
    setLocalFilters(prev => {
      const currentOptions = prev.dietaryOptions || [];
      const isSelected = currentOptions.includes(option);
      
      return {
        ...prev,
        dietaryOptions: isSelected
          ? currentOptions.filter(o => o !== option)
          : [...currentOptions, option],
      };
    });
  };


  const handleNutritionScoreChange = (field: 'minNutritionScore' | 'maxNutritionScore', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setLocalFilters(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, textStyles.heading3]}>Filter Foods</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Categories */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>Category</Text>
            <View style={styles.optionsGrid}>
              {Object.values(FOOD_CATEGORIES).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionChip,
                    { 
                      backgroundColor: localFilters.category === category 
                        ? theme.primary 
                        : theme.surfaceVariant 
                    }
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { 
                        color: localFilters.category === category 
                          ? '#FFFFFF' 
                          : theme.text 
                      }
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Dietary Options */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>Dietary Options</Text>
            <View style={styles.optionsGrid}>
              {Object.values(DIETARY_OPTIONS).map((option) => {
                const isSelected = localFilters.dietaryOptions?.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      { 
                        backgroundColor: isSelected 
                          ? theme.primary 
                          : theme.surfaceVariant 
                      }
                    ]}
                    onPress={() => handleDietaryOptionToggle(option)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { 
                          color: isSelected 
                            ? '#FFFFFF' 
                            : theme.text 
                        }
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Price Category */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>Price Category</Text>
            <View style={styles.optionsGrid}>
              {['$', '$$', '$$$'].map((category) => {
                const isSelected = localFilters.priceCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.optionChip,
                      { 
                        backgroundColor: isSelected 
                          ? theme.primary 
                          : theme.surfaceVariant 
                      }
                    ]}
                    onPress={() => {
                      setLocalFilters(prev => ({
                        ...prev,
                        priceCategory: prev.priceCategory === category ? undefined : category,
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { 
                          color: isSelected 
                            ? '#FFFFFF' 
                            : theme.text 
                        }
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Nutrition Score Range */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>Nutrition Score (0-10)</Text>
            <View style={styles.rangeContainer}>
              <TextInput
                placeholder="Min"
                value={localFilters.minNutritionScore?.toString() || ''}
                onChangeText={(value) => handleNutritionScoreChange('minNutritionScore', value)}
                keyboardType="decimal-pad"
                containerStyle={styles.rangeInput}
              />
              <Text style={[styles.rangeSeparator, textStyles.body]}>to</Text>
              <TextInput
                placeholder="Max"
                value={localFilters.maxNutritionScore?.toString() || ''}
                onChangeText={(value) => handleNutritionScoreChange('maxNutritionScore', value)}
                keyboardType="decimal-pad"
                containerStyle={styles.rangeInput}
              />
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <Button
            title="Reset"
            variant="outline"
            onPress={handleReset}
            style={styles.footerButton}
          />
          <Button
            title="Apply Filters"
            variant="primary"
            onPress={handleApply}
            style={styles.footerButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 1,
    marginBottom: 0,
  },
  rangeSeparator: {
    marginHorizontal: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});

export default FoodFilterModal;