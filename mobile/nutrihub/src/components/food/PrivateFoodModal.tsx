/**
 * PrivateFoodModal Component
 * 
 * Modal for creating and editing private/custom food items.
 * Based on ProposeFoodModal but saves locally instead of proposing for review.
 */

import React, { useState, useEffect } from 'react';
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
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import useForm from '../../hooks/useForm';
import { PrivateFoodItem, FoodCategoryType } from '../../types/types';
import { FOOD_CATEGORIES } from '../../constants/foodConstants';
import { privateFoodService } from '../../services/api/privateFood.service';

interface PrivateFoodModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (food: PrivateFoodItem) => void;
    editingFood?: PrivateFoodItem | null; // For editing existing private food
}

interface PrivateFoodFormData {
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

const PrivateFoodModal: React.FC<PrivateFoodModalProps> = ({
    visible,
    onClose,
    onSave,
    editingFood,
}) => {
    const { theme, textStyles } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<FoodCategoryType | null>(null);
    const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Form validation rules
    const validationRules = {
        name: [
            { validator: (value: string) => value.trim().length > 0, message: 'Food name is required' },
            { validator: (value: string) => value.trim().length >= 2, message: 'Food name must be at least 2 characters' },
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
        isSubmitting,
        setFieldValue,
        validateForm,
    } = useForm<PrivateFoodFormData>({
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
        },
        validationRules,
        onSubmit: async () => {
            await handleSave();
        },
    });

    // Populate form when editing
    useEffect(() => {
        if (editingFood && visible) {
            setFieldValue('name', editingFood.title);
            setFieldValue('category', editingFood.category);
            setFieldValue('servingSize', (editingFood.servingSize || 100).toString());
            setFieldValue('calories', (editingFood.macronutrients?.calories || 0).toString());
            setFieldValue('carbohydrates', (editingFood.macronutrients?.carbohydrates || 0).toString());
            setFieldValue('protein', (editingFood.macronutrients?.protein || 0).toString());
            setFieldValue('fat', (editingFood.macronutrients?.fat || 0).toString());
            setFieldValue('fiber', (editingFood.macronutrients?.fiber || '').toString());
            setFieldValue('sugar', (editingFood.macronutrients?.sugar || '').toString());
            setSelectedCategory(editingFood.category);
            setSelectedDietaryOptions(editingFood.dietaryOptions as string[] || []);
        }
    }, [editingFood, visible]);

    // Get icon based on category
    const getCategoryIcon = (category: string): string => {
        switch (category) {
            case 'Fruit': return 'food-apple';
            case 'Vegetable': return 'food-broccoli';
            case 'Dairy': return 'food-variant';
            case 'Meat': return 'food-drumstick';
            case 'Grain': return 'barley';
            case 'Legume': return 'food-bean';
            case 'Nuts & Seeds': return 'peanut';
            case 'Beverage': return 'cup';
            case 'Snack': return 'cookie';
            case 'Condiment': return 'sauce';
            default: return 'food';
        }
    };

    // Handle save
    const handleSave = async () => {
        if (!isFormValid()) return;

        setIsSaving(true);
        try {
            const foodData = {
                title: values.name.trim(),
                description: `Private food: ${values.name.trim()}`,
                iconName: getCategoryIcon(values.category),
                category: values.category as FoodCategoryType,
                servingSize: parseFloat(values.servingSize),
                macronutrients: {
                    calories: parseFloat(values.calories),
                    protein: parseFloat(values.protein),
                    carbohydrates: parseFloat(values.carbohydrates),
                    fat: parseFloat(values.fat),
                    fiber: values.fiber ? parseFloat(values.fiber) : undefined,
                    sugar: values.sugar ? parseFloat(values.sugar) : undefined,
                },
                dietaryOptions: selectedDietaryOptions,
            };

            let savedFood: PrivateFoodItem;

            if (editingFood) {
                // Update existing food
                savedFood = await privateFoodService.updatePrivateFood(editingFood.id, foodData);
            } else {
                // Create new food
                savedFood = await privateFoodService.addPrivateFood(foodData as any);
            }

            onSave(savedFood);
            handleClose();
        } catch (error: any) {
            console.error('Error saving private food:', error);
            Alert.alert('Error', error.message || 'Failed to save private food. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        resetForm();
        setSelectedCategory(null);
        setSelectedDietaryOptions([]);
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

    // Get field error
    const getFieldError = (field: keyof PrivateFoodFormData): string | undefined => {
        return touched[field] ? errors[field] : undefined;
    };

    // Check if form is valid
    const isFormValid = () => {
        return values.name.trim().length >= 2 &&
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
                        <View style={[styles.headerBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Icon name="lock" size={16} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, textStyles.heading3]}>
                            {editingFood ? 'Edit Private Food' : 'Create Private Food'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Private Food Info Banner */}
                        <View style={[styles.infoBanner, { backgroundColor: theme.primary + '15' }]}>
                            <Icon name="information" size={20} color={theme.primary} />
                            <Text style={[styles.infoBannerText, { color: theme.primary }]}>
                                Private foods are stored locally and can be used immediately in your nutrition tracking.
                            </Text>
                        </View>

                        {/* Basic Information */}
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="information" size={20} color={theme.primary} />
                                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Basic Information</Text>
                            </View>

                            <TextInput
                                label="Food Name *"
                                placeholder="e.g., Homemade Egg, Local Honey"
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
                                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Dietary Options (Optional)</Text>
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
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: theme.divider }]}>
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={handleClose}
                            style={styles.footerButton}
                        />
                        <Button
                            title={editingFood ? 'Update' : 'Save Private Food'}
                            variant="primary"
                            onPress={handleSubmit}
                            disabled={!isFormValid() || isSaving}
                            loading={isSaving}
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
        gap: SPACING.sm,
    },
    headerBadge: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
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
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    halfWidth: {
        flex: 1,
    },
    errorText: {
        fontSize: 12,
        marginTop: SPACING.xs,
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderTopWidth: 1,
        gap: SPACING.md,
    },
    footerButton: {
        flex: 1,
    },
});

export default PrivateFoodModal;
