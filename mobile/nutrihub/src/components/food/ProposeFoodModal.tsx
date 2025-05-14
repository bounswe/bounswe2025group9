/**
 * ProposeFoodModal Component
 * 
 * A modal for proposing new food items to be added to the catalog.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import useForm from '../../hooks/useForm';
import { FoodCategoryType } from '../../types/types';
import { FOOD_CATEGORIES } from '../../constants/foodConstants';

interface ProposeFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FoodProposalData) => void;
}

export interface FoodProposalData {
  name: string;
  category: string;  // Keep as string for form validation
  servingSize: string; // In grams
  calories: string;
  carbohydrates: string;
  protein: string;
  fat: string;
  fiber?: string;
  sugar?: string;
}

const ProposeFoodModal: React.FC<ProposeFoodModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { theme, textStyles } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryType | null>(null);
  
  // Form validation rules
  const validationRules = {
    name: [
      { validator: (value: string) => value.trim().length > 0, message: 'Food name is required' },
      { validator: (value: string) => value.trim().length >= 3, message: 'Food name must be at least 3 characters' },
    ],
    category: [
      { validator: (value: string) => value.trim().length > 0, message: 'Food category is required' },
    ],
    servingSize: [
      { validator: (value: string) => value.trim().length > 0, message: 'Serving size is required' },
      { validator: (value: string) => !isNaN(parseFloat(value)), message: 'Serving size must be a number' },
      { validator: (value: string) => parseFloat(value) > 0, message: 'Serving size must be positive' },
    ],
    calories: [
      { validator: (value: string) => value.trim().length > 0, message: 'Calories is required' },
      { validator: (value: string) => !isNaN(parseFloat(value)), message: 'Calories must be a number' },
      { validator: (value: string) => parseFloat(value) >= 0, message: 'Calories must be positive' },
    ],
    carbohydrates: [
      { validator: (value: string) => value.trim().length > 0, message: 'Carbohydrates is required' },
      { validator: (value: string) => !isNaN(parseFloat(value)), message: 'Carbohydrates must be a number' },
      { validator: (value: string) => parseFloat(value) >= 0, message: 'Carbohydrates must be positive' },
    ],
    protein: [
      { validator: (value: string) => value.trim().length > 0, message: 'Protein is required' },
      { validator: (value: string) => !isNaN(parseFloat(value)), message: 'Protein must be a number' },
      { validator: (value: string) => parseFloat(value) >= 0, message: 'Protein must be positive' },
    ],
    fat: [
      { validator: (value: string) => value.trim().length > 0, message: 'Fat is required' },
      { validator: (value: string) => !isNaN(parseFloat(value)), message: 'Fat must be a number' },
      { validator: (value: string) => parseFloat(value) >= 0, message: 'Fat must be positive' },
    ],
  };
  
  // Initialize form
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    isValid,
    isSubmitting,
    setFieldValue,
    validateForm,
  } = useForm<FoodProposalData>({
    initialValues: {
      name: '',
      category: '',
      servingSize: '100', // Default to 100g
      calories: '',
      carbohydrates: '',
      protein: '',
      fat: '',
      fiber: '',
      sugar: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      onSubmit(formValues);
      handleClose();
    },
  });
  
  // Handle modal close
  const handleClose = () => {
    resetForm();
    setSelectedCategory(null);
    onClose();
  };
  
  // Handle category selection
  const handleCategorySelect = (category: FoodCategoryType) => {
    setSelectedCategory(category);
    setFieldValue('category', category);
    // Trigger validation after setting the value
    setTimeout(() => {
      validateForm();
    }, 0);
  };
  
  // Get field error
  const getFieldError = (field: keyof FoodProposalData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return values.name.trim().length >= 3 &&
           values.category.trim().length > 0 &&
           values.servingSize.trim().length > 0 && !isNaN(parseFloat(values.servingSize)) && parseFloat(values.servingSize) > 0 &&
           values.calories.trim().length > 0 && !isNaN(parseFloat(values.calories)) && parseFloat(values.calories) >= 0 &&
           values.carbohydrates.trim().length > 0 && !isNaN(parseFloat(values.carbohydrates)) && parseFloat(values.carbohydrates) >= 0 &&
           values.protein.trim().length > 0 && !isNaN(parseFloat(values.protein)) && parseFloat(values.protein) >= 0 &&
           values.fat.trim().length > 0 && !isNaN(parseFloat(values.fat)) && parseFloat(values.fat) >= 0;
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.header}>
            <Text style={[styles.title, textStyles.heading3]}>Propose New Food</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Information */}
            <Card style={styles.section}>
              <TextInput
                label="Food Name *"
                placeholder="Enter food name"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={getFieldError('name')}
              />
              
              <View style={styles.categorySection}>
                <Text style={[styles.fieldLabel, textStyles.body]}>Food Category *</Text>
                <View style={styles.categoryGrid}>
                  {Object.values(FOOD_CATEGORIES).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category && styles.categoryChipSelected,
                        { 
                          backgroundColor: selectedCategory === category 
                            ? theme.primary 
                            : theme.surfaceVariant,
                          borderColor: errors.category && touched.category 
                            ? theme.error 
                            : 'transparent',
                          borderWidth: errors.category && touched.category ? 1 : 0,
                        }
                      ]}
                      onPress={() => handleCategorySelect(category)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { 
                            color: selectedCategory === category 
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
                
                {errors.category && touched.category && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {errors.category}
                  </Text>
                )}
              </View>
            </Card>

            {/* Serving and Calories */}
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, textStyles.subtitle]}>
                Nutrition Information
              </Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Serving Size (g) *"
                    placeholder="100"
                    value={values.servingSize}
                    onChangeText={handleChange('servingSize')}
                    onBlur={handleBlur('servingSize')}
                    error={getFieldError('servingSize')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Calories (kcal) *"
                    placeholder="Enter calories"
                    value={values.calories}
                    onChangeText={handleChange('calories')}
                    onBlur={handleBlur('calories')}
                    error={getFieldError('calories')}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </Card>

            {/* Macronutrients */}
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, textStyles.subtitle]}>
                Macronutrients (per serving)
              </Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Carbohydrates (g) *"
                    placeholder="Enter carbs"
                    value={values.carbohydrates}
                    onChangeText={handleChange('carbohydrates')}
                    onBlur={handleBlur('carbohydrates')}
                    error={getFieldError('carbohydrates')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Protein (g) *"
                    placeholder="Enter protein"
                    value={values.protein}
                    onChangeText={handleChange('protein')}
                    onBlur={handleBlur('protein')}
                    error={getFieldError('protein')}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Fat (g) *"
                    placeholder="Enter fat"
                    value={values.fat}
                    onChangeText={handleChange('fat')}
                    onBlur={handleBlur('fat')}
                    error={getFieldError('fat')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Fiber (g)"
                    placeholder="Optional"
                    value={values.fiber}
                    onChangeText={handleChange('fiber')}
                    onBlur={handleBlur('fiber')}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TextInput
                label="Sugar (g)"
                placeholder="Optional"
                value={values.sugar}
                onChangeText={handleChange('sugar')}
                onBlur={handleBlur('sugar')}
                keyboardType="decimal-pad"
              />
            </Card>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.divider }]}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              style={styles.footerButton}
            />
            <Button
              title="Submit Proposal"
              variant="primary"
              onPress={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              loading={isSubmitting}
              style={styles.footerButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  fieldLabel: {
    marginBottom: SPACING.sm,
  },
  categorySection: {
    marginTop: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  categoryChipSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
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

export default ProposeFoodModal;