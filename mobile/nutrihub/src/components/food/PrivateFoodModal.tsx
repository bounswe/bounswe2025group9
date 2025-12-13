/**
 * PrivateFoodModal Component
 * 
 * A modal for creating and editing private food items.
 * Similar to ProposeFoodModal but for local storage.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../common/Card';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import { PrivateFood } from '../../types/nutrition';
import { FoodCategoryType } from '../../types/types';
import { FOOD_CATEGORIES } from '../../constants/foodConstants';
import { privateFoodService } from '../../services/api/privateFood.service';

// Dietary options
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

interface PrivateFoodModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (food: PrivateFood) => void;
    editFood?: PrivateFood | null;
    initialData?: {
        name: string;
        category: string;
        servingSize: number;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        dietaryOptions?: string[];
        micronutrients?: Record<string, number>;
    };
}

const PrivateFoodModal: React.FC<PrivateFoodModalProps> = ({
    visible,
    onClose,
    onSave,
    editFood,
    initialData,
}) => {
    const { theme, textStyles } = useTheme();

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState<FoodCategoryType | ''>('');
    const [servingSize, setServingSize] = useState('100');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fat, setFat] = useState('');
    const [fiber, setFiber] = useState('');
    const [sugar, setSugar] = useState('');
    const [saving, setSaving] = useState(false);

    // Additional fields
    const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
    const [micronutrients, setMicronutrients] = useState<Record<string, string>>({});
    const [showMicronutrients, setShowMicronutrients] = useState(false);
    const [showAddMicroModal, setShowAddMicroModal] = useState(false);
    const [selectedMicroKey, setSelectedMicroKey] = useState('');
    const [microValue, setMicroValue] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [currency, setCurrency] = useState('TRY');
    const [priceUnit, setPriceUnit] = useState<'per_100g' | 'per_unit'>('per_100g');

    const isEditMode = !!editFood;

    // Initialize form when modal opens
    useEffect(() => {
        if (visible) {
            if (editFood) {
                setName(editFood.name);
                setCategory(editFood.category as FoodCategoryType);
                setServingSize(editFood.servingSize.toString());
                setCalories(editFood.calories.toString());
                setProtein(editFood.protein.toString());
                setCarbohydrates(editFood.carbohydrates.toString());
                setFat(editFood.fat.toString());
                setFiber(editFood.fiber?.toString() || '');
                setSugar(editFood.sugar?.toString() || '');
                setSelectedDietaryOptions(editFood.dietaryOptions || []);
                const microObj: Record<string, string> = {};
                if (editFood.micronutrients) {
                    Object.entries(editFood.micronutrients).forEach(([k, v]) => {
                        microObj[k] = v.toString();
                    });
                }
                setMicronutrients(microObj);
            } else if (initialData) {
                setName(initialData.name);
                setCategory(initialData.category as FoodCategoryType);
                setServingSize(initialData.servingSize.toString());
                setCalories(initialData.calories.toString());
                setProtein(initialData.protein.toString());
                setCarbohydrates(initialData.carbohydrates.toString());
                setFat(initialData.fat.toString());
                setFiber(initialData.fiber?.toString() || '');
                setSugar(initialData.sugar?.toString() || '');
                setSelectedDietaryOptions(initialData.dietaryOptions || []);
                const microObj: Record<string, string> = {};
                if (initialData.micronutrients) {
                    Object.entries(initialData.micronutrients).forEach(([k, v]) => {
                        microObj[k] = v.toString();
                    });
                }
                setMicronutrients(microObj);
            } else {
                resetForm();
            }
        }
    }, [visible, editFood, initialData]);

    const resetForm = () => {
        setName('');
        setCategory('');
        setServingSize('100');
        setCalories('');
        setProtein('');
        setCarbohydrates('');
        setFat('');
        setFiber('');
        setSugar('');
        setSelectedDietaryOptions([]);
        setMicronutrients({});
        setShowMicronutrients(false);
        setImageUrl('');
        setBasePrice('');
        setCurrency('TRY');
        setPriceUnit('per_100g');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Toggle dietary option
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

        setMicronutrients(prev => ({
            ...prev,
            [selectedMicroKey]: microValue,
        }));

        setShowAddMicroModal(false);
        setSelectedMicroKey('');
        setMicroValue('');
    };

    // Remove micronutrient
    const handleRemoveMicronutrient = (key: string) => {
        const newMicros = { ...micronutrients };
        delete newMicros[key];
        setMicronutrients(newMicros);
    };

    // Get available micronutrients
    const availableMicronutrients = MICRONUTRIENTS.filter(
        m => !micronutrients[m.key]
    );

    // Validate form
    const validateForm = (): boolean => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a food name');
            return false;
        }
        if (name.trim().length < 3) {
            Alert.alert('Error', 'Food name must be at least 3 characters');
            return false;
        }
        if (!calories || isNaN(parseFloat(calories)) || parseFloat(calories) < 0) {
            Alert.alert('Error', 'Please enter valid calories');
            return false;
        }
        if (!protein || isNaN(parseFloat(protein)) || parseFloat(protein) < 0) {
            Alert.alert('Error', 'Please enter valid protein');
            return false;
        }
        if (!carbohydrates || isNaN(parseFloat(carbohydrates)) || parseFloat(carbohydrates) < 0) {
            Alert.alert('Error', 'Please enter valid carbohydrates');
            return false;
        }
        if (!fat || isNaN(parseFloat(fat)) || parseFloat(fat) < 0) {
            Alert.alert('Error', 'Please enter valid fat');
            return false;
        }
        if (!servingSize || isNaN(parseFloat(servingSize)) || parseFloat(servingSize) <= 0) {
            Alert.alert('Error', 'Please enter valid serving size');
            return false;
        }
        return true;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            // Convert micronutrients to numbers
            const microObj: Record<string, number> = {};
            Object.entries(micronutrients).forEach(([k, v]) => {
                const num = parseFloat(v);
                if (!isNaN(num)) {
                    microObj[k] = num;
                }
            });

            const foodData = {
                name: name.trim(),
                category: category || 'Other',
                servingSize: parseFloat(servingSize),
                calories: parseFloat(calories),
                protein: parseFloat(protein),
                carbohydrates: parseFloat(carbohydrates),
                fat: parseFloat(fat),
                fiber: fiber ? parseFloat(fiber) : undefined,
                sugar: sugar ? parseFloat(sugar) : undefined,
                dietaryOptions: selectedDietaryOptions,
                micronutrients: Object.keys(microObj).length > 0 ? microObj : undefined,
                sourceType: (editFood?.sourceType || (initialData ? 'modified_proposal' : 'custom')) as 'custom' | 'modified_proposal',
            };

            let savedFood: PrivateFood;

            if (isEditMode && editFood) {
                const updated = await privateFoodService.updatePrivateFood(editFood.id, foodData);
                if (!updated) {
                    throw new Error('Failed to update private food');
                }
                savedFood = updated;
                Alert.alert('Success', 'Private food updated successfully');
            } else {
                savedFood = await privateFoodService.addPrivateFood(foodData);
                Alert.alert('Success', 'Private food created successfully');
            }

            onSave?.(savedFood);
            handleClose();
        } catch (error) {
            console.error('Error saving private food:', error);
            Alert.alert('Error', 'Failed to save private food. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = () => {
        if (!editFood) return;

        Alert.alert(
            'Delete Private Food',
            `Are you sure you want to delete "${editFood.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await privateFoodService.deletePrivateFood(editFood.id);
                            Alert.alert('Success', 'Private food deleted');
                            handleClose();
                        } catch (error) {
                            console.error('Error deleting private food:', error);
                            Alert.alert('Error', 'Failed to delete private food');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Icon name="lock" size={24} color={theme.success} />
                        <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm, flex: 1 }]}>
                            {isEditMode ? 'Edit Private Food' : 'Create Private Food'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Info Banner */}
                        <View style={[styles.infoBanner, { backgroundColor: `${theme.success}15` }]}>
                            <Icon name="information" size={20} color={theme.success} />
                            <Text style={[textStyles.caption, { color: theme.success, marginLeft: SPACING.sm, flex: 1 }]}>
                                Private foods are stored locally and can be used immediately in nutrition tracking.
                            </Text>
                        </View>

                        {/* Basic Information */}
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="information" size={20} color={theme.primary} />
                                <Text style={[textStyles.subtitle, { color: theme.text, marginLeft: SPACING.sm }]}>
                                    Basic Information
                                </Text>
                            </View>

                            <TextInput
                                label="Food Name *"
                                placeholder="Enter food name"
                                value={name}
                                onChangeText={setName}
                            />

                            <View style={styles.pickerContainer}>
                                <Text style={[styles.label, textStyles.body, { color: theme.text }]}>Category</Text>
                                <View style={[styles.pickerWrapper, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Picker
                                        selectedValue={category}
                                        onValueChange={(value) => setCategory(value as FoodCategoryType)}
                                        style={{ color: theme.text }}
                                    >
                                        <Picker.Item label="Select category (optional)" value="" />
                                        {Object.values(FOOD_CATEGORIES).map((cat) => (
                                            <Picker.Item key={cat} label={cat} value={cat} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </Card>

                        {/* Nutrition Information */}
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="nutrition" size={20} color={theme.primary} />
                                <Text style={[textStyles.subtitle, { color: theme.text, marginLeft: SPACING.sm }]}>
                                    Nutrition Information
                                </Text>
                            </View>

                            <TextInput
                                label="Serving Size (g) *"
                                placeholder="100"
                                value={servingSize}
                                onChangeText={setServingSize}
                                keyboardType="decimal-pad"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Calories (kcal) *"
                                        placeholder="0"
                                        value={calories}
                                        onChangeText={setCalories}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Protein (g) *"
                                        placeholder="0"
                                        value={protein}
                                        onChangeText={setProtein}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Carbohydrates (g) *"
                                        placeholder="0"
                                        value={carbohydrates}
                                        onChangeText={setCarbohydrates}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Fat (g) *"
                                        placeholder="0"
                                        value={fat}
                                        onChangeText={setFat}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Fiber (g)"
                                        placeholder="Optional"
                                        value={fiber}
                                        onChangeText={setFiber}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <TextInput
                                        label="Sugar (g)"
                                        placeholder="Optional"
                                        value={sugar}
                                        onChangeText={setSugar}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </Card>

                        {/* Dietary Options */}
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="food-variant" size={20} color={theme.primary} />
                                <Text style={[textStyles.subtitle, { color: theme.text, marginLeft: SPACING.sm }]}>
                                    Dietary Options
                                </Text>
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

                        {/* Micronutrients */}
                        <Card style={styles.section}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => setShowMicronutrients(!showMicronutrients)}
                            >
                                <Icon name="flask" size={20} color={theme.primary} />
                                <Text style={[textStyles.subtitle, { color: theme.text, marginLeft: SPACING.sm, flex: 1 }]}>
                                    Micronutrients ({Object.keys(micronutrients).length})
                                </Text>
                                <Icon
                                    name={showMicronutrients ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </TouchableOpacity>

                            {showMicronutrients && (
                                <View>
                                    {Object.entries(micronutrients).map(([key, value]) => {
                                        const micro = MICRONUTRIENTS.find(m => m.key === key);
                                        if (!micro || !value) return null;

                                        return (
                                            <View key={key} style={[styles.addedMicroItem, { backgroundColor: theme.surfaceVariant }]}>
                                                <View style={styles.addedMicroInfo}>
                                                    <Text style={[textStyles.body, { color: theme.text }]}>
                                                        {micro.label}
                                                    </Text>
                                                    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
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

                                    {availableMicronutrients.length > 0 && (
                                        <TouchableOpacity
                                            style={[styles.addMicroButton, { backgroundColor: theme.primary }]}
                                            onPress={() => setShowAddMicroModal(true)}
                                        >
                                            <Icon name="plus" size={20} color="#FFFFFF" />
                                            <Text style={{ color: '#FFFFFF', marginLeft: SPACING.xs }}>
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
                                <Text style={[textStyles.subtitle, { color: theme.text, marginLeft: SPACING.sm }]}>
                                    Image (Optional)
                                </Text>
                            </View>

                            <TextInput
                                label="Image URL"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChangeText={setImageUrl}
                            />
                        </Card>

                        {/* Delete Button (Edit mode only) */}
                        {isEditMode && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { borderColor: theme.error }]}
                                onPress={handleDelete}
                            >
                                <Icon name="delete" size={20} color={theme.error} />
                                <Text style={[textStyles.body, { color: theme.error, marginLeft: SPACING.sm }]}>
                                    Delete Private Food
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={handleClose}
                            style={styles.footerButton}
                        />
                        <Button
                            title={isEditMode ? 'Update' : 'Create'}
                            variant="primary"
                            onPress={handleSave}
                            loading={saving}
                            disabled={saving}
                            style={styles.footerButton}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* Add Micronutrient Modal */}
            <Modal
                visible={showAddMicroModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => {
                    Keyboard.dismiss();
                    setShowAddMicroModal(false);
                }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.microModalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.microModalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[textStyles.heading3, { color: theme.text, marginBottom: SPACING.md }]}>
                                    Add Micronutrient
                                </Text>

                                <View style={[styles.pickerWrapper, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, marginBottom: SPACING.md }]}>
                                    <Picker
                                        selectedValue={selectedMicroKey}
                                        onValueChange={(value) => setSelectedMicroKey(value)}
                                        style={{ color: theme.text }}
                                    >
                                        <Picker.Item label="Select micronutrient" value="" />
                                        {availableMicronutrients.map((micro) => (
                                            <Picker.Item key={micro.key} label={`${micro.label} (${micro.unit})`} value={micro.key} />
                                        ))}
                                    </Picker>
                                </View>

                                <TextInput
                                    label="Value"
                                    placeholder="Enter value"
                                    value={microValue}
                                    onChangeText={setMicroValue}
                                    keyboardType="decimal-pad"
                                />

                                <View style={[styles.row, { marginTop: SPACING.md }]}>
                                    <Button
                                        title="Cancel"
                                        variant="outline"
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setShowAddMicroModal(false);
                                        }}
                                        style={styles.halfWidth}
                                    />
                                    <Button
                                        title="Add"
                                        variant="primary"
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            handleAddMicronutrient();
                                        }}
                                        style={styles.halfWidth}
                                    />
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
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
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
    },
    section: {
        marginBottom: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    halfWidth: {
        flex: 1,
    },
    pickerContainer: {
        marginTop: SPACING.sm,
    },
    label: {
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    pickerWrapper: {
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dietaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    dietaryChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
    },
    dietaryChipSelected: {},
    dietaryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addedMicroItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.xs,
    },
    addedMicroInfo: {
        flex: 1,
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
        marginTop: SPACING.sm,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        marginTop: SPACING.md,
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderTopWidth: 1,
        gap: SPACING.sm,
    },
    footerButton: {
        flex: 1,
    },
    microModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    microModalContent: {
        width: '100%',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
    },
});

export default PrivateFoodModal;
