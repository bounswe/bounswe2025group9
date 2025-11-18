/**
 * FoodCompareScreen
 * 
 * Allows users to compare nutritional information of 2 foods side by side.
 * Features:
 * - Select 2 foods using search modal
 * - View macronutrient comparison with circular progress
 * - Remove selected foods
 * - See comparison only when 2 foods are selected
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FoodItem } from '../../types/types';
import FoodSelectorModal from '../../components/food/FoodSelectorModal';
import NutritionCompare from '../../components/food/NutritionCompare';

const FoodCompareScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [selectorModalVisible, setSelectorModalVisible] = useState(false);

  const handleFoodSelect = (food: FoodItem) => {
    // Prevent duplicates
    if (selectedFoods.find(f => f.id === food.id)) {
      Alert.alert('Duplicate Food', 'This food is already selected for comparison.');
      return;
    }
    
    // Limit to 2 foods
    if (selectedFoods.length >= 2) {
      Alert.alert('Maximum Reached', 'You can compare up to 2 foods only.');
      return;
    }
    
    setSelectedFoods([...selectedFoods, food]);
  };

  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods(selectedFoods.filter(f => f.id !== foodId));
  };

  const handleAddFood = () => {
    // Prevent opening selector if already at limit
    if (selectedFoods.length >= 2) {
      Alert.alert('Maximum Reached', 'You can compare up to 2 foods only.');
      return;
    }
    setSelectorModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, textStyles.heading2]}>Compare Foods</Text>
          <Text style={[styles.subtitle, textStyles.body, { color: theme.textSecondary }]}>
            Select 2 foods to compare their nutritional values
          </Text>
        </View>

        {/* Food Selector Section */}
        <View style={[styles.selectorCard, { backgroundColor: theme.card }]}>
          <View style={styles.selectorHeader}>
            <Text style={[styles.selectorTitle, textStyles.heading4]}>
              Selected Foods
            </Text>
            <View style={[styles.countBadge, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.countText, { color: theme.primary }]}>
                {selectedFoods.length}/2
              </Text>
            </View>
          </View>

          {/* Selected Foods List */}
          <View style={styles.selectedFoodsContainer}>
            {selectedFoods.length > 0 ? (
              selectedFoods.map((food) => (
                <View 
                  key={food.id} 
                  style={[styles.selectedFoodItem, { backgroundColor: theme.background }]}
                >
                  {food.imageUrl ? (
                    <Image 
                      source={{ uri: food.imageUrl }} 
                      style={styles.foodImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.foodImagePlaceholder, { backgroundColor: theme.surface }]}>
                      <Icon name={food.iconName} size={24} color={theme.textSecondary} />
                    </View>
                  )}
                  
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, textStyles.body]} numberOfLines={1}>
                      {food.title}
                    </Text>
                    <Text style={[styles.foodCategory, textStyles.caption, { color: theme.textSecondary }]}>
                      {food.category}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleRemoveFood(food.id)}
                    style={styles.removeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close-circle" size={24} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="food-off" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                  No foods selected yet
                </Text>
              </View>
            )}
          </View>

          {/* Add Food Button */}
          <TouchableOpacity
            onPress={handleAddFood}
            disabled={selectedFoods.length >= 3}
            style={[
              styles.addButton,
              { backgroundColor: theme.primary },
              selectedFoods.length >= 3 && styles.addButtonDisabled
            ]}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={24} color={PALETTE.NEUTRAL.WHITE} />
            <Text style={[styles.addButtonText, textStyles.button]}>
              Add Foods
            </Text>
          </TouchableOpacity>

          {/* Helper Text */}
          {selectedFoods.length === 1 && (
            <Text style={[styles.helperText, textStyles.caption, { color: theme.textSecondary }]}>
              Select one more food to enable comparison
            </Text>
          )}
          {selectedFoods.length >= 2 && (
            <Text style={[styles.helperText, textStyles.caption, { color: theme.textSecondary }]}>
              Maximum of 2 foods can be compared
            </Text>
          )}
        </View>

        {/* Comparison Results Section */}
        <View style={[styles.comparisonCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.comparisonTitle, textStyles.heading4]}>
            Comparison Results
          </Text>
          
          {selectedFoods.length === 2 ? (
            <NutritionCompare foods={selectedFoods} />
          ) : (
            <View style={styles.comparisonEmptyState}>
              <Icon name="chart-line" size={64} color={theme.textSecondary} />
              <Text style={[styles.comparisonEmptyText, textStyles.body, { color: theme.textSecondary }]}>
                Select two foods to start comparing
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.tipsTitle, textStyles.heading4]}>
            Comparison Tips
          </Text>
          <View style={styles.tipsList}>
            <TipItem icon="check-circle" text="Compare up to 3 foods side by side" />
            <TipItem icon="star" text="Check nutrition scores for health value" />
            <TipItem icon="food-apple" text="Compare macronutrients (protein, carbs, fats)" />
            <TipItem icon="fire" text="View calorie content per serving" />
            <TipItem icon="leaf" text="Check dietary compatibility" />
          </View>
        </View>
      </ScrollView>

      {/* Food Selector Modal */}
      <FoodSelectorModal
        visible={selectorModalVisible}
        onClose={() => setSelectorModalVisible(false)}
        onSelect={handleFoodSelect}
      />
    </SafeAreaView>
  );
};

// Helper component for tips
const TipItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const { theme, textStyles } = useTheme();
  
  return (
    <View style={styles.tipItem}>
      <Icon 
        name={icon as any} 
        size={16} 
        color={theme.primary} 
        style={styles.tipIcon}
      />
      <Text style={[styles.tipText, textStyles.caption, { color: theme.text }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    marginTop: SPACING.xs,
  },
  selectorCard: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  selectorTitle: {
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedFoodsContainer: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  selectedFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  foodImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  foodCategory: {
    fontSize: 12,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: PALETTE.NEUTRAL.WHITE,
    fontWeight: 'bold',
  },
  helperText: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  comparisonCard: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comparisonTitle: {
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  comparisonEmptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  comparisonEmptyText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  tipsCard: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    marginBottom: SPACING.md,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: SPACING.sm,
  },
  tipText: {
    flex: 1,
  },
});

export default FoodCompareScreen;

