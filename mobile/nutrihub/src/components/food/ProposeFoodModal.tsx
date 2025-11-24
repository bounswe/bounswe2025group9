/**
 * ProposeFoodModal Component
 * 
 * A comprehensive modal for proposing new food items with full nutrition details.
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
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
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
  category: string;
  servingSize: string;
  calories: string;
  carbohydrates: string;
  protein: string;
  fat: string;
  fiber?: string;
  sugar?: string;
  dietaryOptions?: string[];
  imageUrl?: string;
  basePrice?: string;
  priceUnit?: 'per_100g' | 'per_unit';
  currency?: string;
  micronutrients?: Record<string, string>;
}

// Available dietary options
const DIETARY_OPTIONS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Sugar-Free',
  'Organic',
];

// Common micronutrients
const MICRONUTRIENTS = [
  { key: 'total_sugars', label: 'Total Sugars', unit: 'g' },
  { key: 'water', label: 'Water', unit: 'g' },
  { key: 'polyunsaturated_fat', label: 'Polyunsaturated Fat', unit: 'g' },
  { key: 'monounsaturated_fat', label: 'Monounsaturated Fat', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'choline', label: 'Choline', unit: 'mg' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
  { key: 'niacin', label: 'Niacin', unit: 'mg' },
  { key: 'vitamin_e', label: 'Vitamin E', unit: 'mg' },
  { key: 'zinc', label: 'Zinc', unit: 'mg' },
  { key: 'thiamin', label: 'Thiamin', unit: 'mg' },
  { key: 'riboflavin', label: 'Riboflavin', unit: 'mg' },
  { key: 'vitamin_b6', label: 'Vitamin B-6', unit: 'mg' },
  { key: 'copper', label: 'Copper', unit: 'mg' },
];

const ProposeFoodModal: React.FC<ProposeFoodModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { theme, textStyles } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryType | null>(null);
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
  const [priceUnit, setPriceUnit] = useState<'per_100g' | 'per_unit'>('per_100g');
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [showAddMicroModal, setShowAddMicroModal] = useState(false);
  const [selectedMicroKey, setSelectedMicroKey] = useState<string>('');
  const [microValue, setMicroValue] = useState('');

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
      servingSize: '100',
      calories: '',
      carbohydrates: '',
      protein: '',
      fat: '',
      fiber: '',
      sugar: '',
      dietaryOptions: [],
      imageUrl: '',
      basePrice: '',
      priceUnit: 'per_100g',
      currency: 'TRY',
      micronutrients: {},
    },
    validationRules,
    onSubmit: async (formValues) => {
      const submitData = {
        ...formValues,
        dietaryOptions: selectedDietaryOptions,
        priceUnit,
      };
      onSubmit(submitData);
      handleClose();
    },
  });

  // Handle modal close
  const handleClose = () => {
    resetForm();
    setSelectedCategory(null);
    setSelectedDietaryOptions([]);
    setPriceUnit('per_100g');
    setShowMicronutrients(false);
    onClose();
  };

  // Handle category selection
  const handleCategorySelect = (category: FoodCategoryType) => {
    setSelectedCategory(category);
    setFieldValue('category', category);
    setTimeout(() => {
      validateForm();
    }, 0);
  };

  // Handle dietary option toggle
  const toggleDietaryOption = (option: string) => {
    setSelectedDietaryOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  // Handle micronutrient addition
  const handleAddMicronutrient = () => {
    if (!selectedMicroKey) {
      Alert.alert('Error', 'Please select a micronutrient');
      return;
    }
    if (!microValue || microValue.trim() === '') {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    setFieldValue('micronutrients', {
      ...values.micronutrients,
      [selectedMicroKey]: microValue,
    });

    setShowAddMicroModal(false);
    setSelectedMicroKey('');
    setMicroValue('');
  };

  // Handle micronutrient removal
  const handleRemoveMicronutrient = (key: string) => {
    const newMicros = { ...values.micronutrients };
    delete newMicros[key];
    setFieldValue('micronutrients', newMicros);
  };

  // Get available micronutrients (not yet added)
  const availableMicronutrients = MICRONUTRIENTS.filter(
    m => !values.micronutrients?.[m.key]
  );

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
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <Icon name="food-apple" size={24} color={theme.primary} />
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
              <View style={styles.sectionHeader}>
                <Icon name="information" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Basic Information</Text>
              </View>

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

            {/* Nutrition Information */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="nutrition" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Nutrition Information</Text>
              </View>

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
              <View style={styles.sectionHeader}>
                <Icon name="chart-donut" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Macronutrients (per serving)</Text>
              </View>

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

            {/* Dietary Options */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="leaf" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Dietary Options</Text>
              </View>

              <View style={styles.dietaryGrid}>
                {DIETARY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dietaryChip,
                      selectedDietaryOptions.includes(option) && styles.dietaryChipSelected,
                      {
                        backgroundColor: selectedDietaryOptions.includes(option)
                          ? theme.primary
                          : theme.surfaceVariant,
                      }
                    ]}
                    onPress={() => toggleDietaryOption(option)}
                  >
                    <Text
                      style={[
                        styles.dietaryChipText,
                        {
                          color: selectedDietaryOptions.includes(option)
                            ? '#FFFFFF'
                            : theme.text
                        }
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Pricing Information */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="currency-usd" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Pricing (Optional)</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Base Price"
                    placeholder="0.00"
                    value={values.basePrice}
                    onChangeText={handleChange('basePrice')}
                    onBlur={handleBlur('basePrice')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Currency"
                    placeholder="TRY"
                    value={values.currency}
                    onChangeText={handleChange('currency')}
                    onBlur={handleBlur('currency')}
                  />
                </View>
              </View>

              <View style={styles.priceUnitContainer}>
                <Text style={[styles.fieldLabel, textStyles.body]}>Price Unit</Text>
                <View style={styles.priceUnitToggle}>
                  <TouchableOpacity
                    style={[
                      styles.priceUnitButton,
                      priceUnit === 'per_100g' && styles.priceUnitButtonActive,
                      {
                        backgroundColor: priceUnit === 'per_100g'
                          ? theme.primary
                          : theme.surfaceVariant
                      }
                    ]}
                    onPress={() => setPriceUnit('per_100g')}
                  >
                    <Text
                      style={[
                        styles.priceUnitText,
                        { color: priceUnit === 'per_100g' ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      Per 100g
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priceUnitButton,
                      priceUnit === 'per_unit' && styles.priceUnitButtonActive,
                      {
                        backgroundColor: priceUnit === 'per_unit'
                          ? theme.primary
                          : theme.surfaceVariant
                      }
                    ]}
                    onPress={() => setPriceUnit('per_unit')}
                  >
                    <Text
                      style={[
                        styles.priceUnitText,
                        { color: priceUnit === 'per_unit' ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      Per Unit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Micronutrients */}
            <Card style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowMicronutrients(!showMicronutrients)}
              >
                <Icon name="flask" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>
                  Micronutrients ({Object.keys(values.micronutrients || {}).length})
                </Text>
                <Icon
                  name={showMicronutrients ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {showMicronutrients && (
                <View>
                  {/* Added micronutrients list */}
                  {Object.entries(values.micronutrients || {}).map(([key, value]) => {
                    const micro = MICRONUTRIENTS.find(m => m.key === key);
                    if (!micro || !value) return null;

                    return (
                      <View key={key} style={[styles.addedMicroItem, { backgroundColor: theme.surfaceVariant }]}>
                        <View style={styles.addedMicroInfo}>
                          <Text style={[styles.addedMicroLabel, textStyles.body]}>
                            {micro.label}
                          </Text>
                          <Text style={[styles.addedMicroValue, textStyles.caption, { color: theme.textSecondary }]}>
                            {value} {micro.unit}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveMicronutrient(key)}
                          style={styles.removeMicroButton}
                        >
                          <Icon name="close-circle" size={20} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* Add micronutrient button */}
                  {availableMicronutrients.length > 0 && (
                    <TouchableOpacity
                      style={[styles.addMicroButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowAddMicroModal(true)}
                    >
                      <Icon name="plus" size={20} color="#FFFFFF" />
                      <Text style={[styles.addMicroButtonText, { color: '#FFFFFF' }]}>
                        Add Micronutrient
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>

            {/* Image URL */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="image" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Image (Optional)</Text>
              </View>

              <TextInput
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                value={values.imageUrl}
                onChangeText={handleChange('imageUrl')}
                onBlur={handleBlur('imageUrl')}
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

      {/* Add Micronutrient Modal */}
      <Modal
        visible={showAddMicroModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMicroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.microModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.microModalTitle, textStyles.heading4]}>Add Micronutrient</Text>

            <View style={styles.pickerContainer}>
              <Text style={[styles.fieldLabel, textStyles.body]}>Select Micronutrient</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: theme.surfaceVariant }]}>
                <Picker
                  selectedValue={selectedMicroKey}
                  onValueChange={(value: string) => setSelectedMicroKey(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Choose..." value="" />
                  {availableMicronutrients.map(micro => (
                    <Picker.Item
                      key={micro.key}
                      label={`${micro.label} (${micro.unit})`}
                      value={micro.key}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <TextInput
              label="Value"
              placeholder="Enter value"
              value={microValue}
              onChangeText={setMicroValue}
              keyboardType="decimal-pad"
            />

            <View style={styles.microModalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowAddMicroModal(false);
                  setSelectedMicroKey('');
                  setMicroValue('');
                }}
                style={styles.microModalButton}
              />
              <Button
                title="Add"
                variant="primary"
                onPress={handleAddMicronutrient}
                style={styles.microModalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    gap: SPACING.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  categorySection: {
    marginTop: SPACING.md,
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
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dietaryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  dietaryChipSelected: {
    transform: [{ scale: 1.05 }],
  },
  dietaryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceUnitContainer: {
    marginTop: SPACING.sm,
  },
  priceUnitToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priceUnitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  priceUnitButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  priceUnitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addedMicroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  addedMicroInfo: {
    flex: 1,
  },
  addedMicroLabel: {
    fontWeight: '500',
  },
  addedMicroValue: {
    marginTop: 2,
  },
  removeMicroButton: {
    padding: SPACING.xs,
  },
  addMicroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addMicroButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  microModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  microModalTitle: {
    marginBottom: SPACING.md,
  },
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  pickerWrapper: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  microModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  microModalButton: {
    flex: 1,
  },
});

export default ProposeFoodModal;