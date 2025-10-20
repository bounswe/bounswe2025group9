import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Recipe } from '../../types/types';

const LikedRecipesScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  // Load user's liked recipes on mount
  useEffect(() => {
    loadLikedRecipes();
  }, []);

  const loadLikedRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const likedRecipesData = await recipeService.getLikedRecipes();
      // setLikedRecipes(likedRecipesData);
      
      // Mock data for now
      const mockLikedRecipes: Recipe[] = [
        {
          id: 1,
          post_id: 101,
          instructions: '1. Preheat oven to 350°F\n2. Mix all dry ingredients in a bowl\n3. Add wet ingredients and mix until combined\n4. Pour into greased pan\n5. Bake for 25-30 minutes until golden brown',
          ingredients: [
            { food_id: 1, food_name: 'Whole Wheat Flour', amount: 200 },
            { food_id: 2, food_name: 'Banana', amount: 150 },
            { food_id: 3, food_name: 'Eggs', amount: 2 },
            { food_id: 4, food_name: 'Honey', amount: 50 },
            { food_id: 5, food_name: 'Almond Milk', amount: 100 }
          ],
          nutrition: {
            calories: 320,
            protein: 12,
            carbs: 45,
            fat: 8
          },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          post_id: 102,
          instructions: '1. Heat olive oil in a large pan\n2. Add diced vegetables and sauté for 5 minutes\n3. Add protein and cook until done\n4. Season with herbs and spices\n5. Serve hot with your choice of grain',
          ingredients: [
            { food_id: 6, food_name: 'Broccoli', amount: 200 },
            { food_id: 7, food_name: 'Bell Peppers', amount: 150 },
            { food_id: 8, food_name: 'Chicken Breast', amount: 250 },
            { food_id: 9, food_name: 'Olive Oil', amount: 15 }
          ],
          nutrition: {
            calories: 280,
            protein: 35,
            carbs: 15,
            fat: 12
          },
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z'
        },
        {
          id: 3,
          post_id: 103,
          instructions: '1. Blend all ingredients in a high-speed blender\n2. Add ice for a thicker consistency\n3. Adjust sweetness to taste\n4. Pour into glass and serve immediately',
          ingredients: [
            { food_id: 10, food_name: 'Spinach', amount: 50 },
            { food_id: 11, food_name: 'Banana', amount: 100 },
            { food_id: 12, food_name: 'Greek Yogurt', amount: 150 },
            { food_id: 13, food_name: 'Berries', amount: 100 },
            { food_id: 14, food_name: 'Almond Butter', amount: 20 }
          ],
          nutrition: {
            calories: 180,
            protein: 15,
            carbs: 25,
            fat: 6
          },
          created_at: '2024-01-08T09:15:00Z',
          updated_at: '2024-01-08T09:15:00Z'
        }
      ];
      
      setLikedRecipes(mockLikedRecipes);
    } catch (err) {
      console.error('Error loading liked recipes:', err);
      setError('Failed to load your liked recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewRecipe = (recipe: Recipe) => {
    // TODO: Navigate to recipe detail
    Alert.alert('View Recipe', `Navigate to recipe: ${recipe.id}`);
  };

  const handleUnlikeRecipe = async (recipeId: number) => {
    try {
      // TODO: Replace with actual API call
      // await recipeService.unlikeRecipe(recipeId);
      
      setLikedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      Alert.alert('Success', 'Recipe removed from your liked recipes');
    } catch (error) {
      Alert.alert('Error', 'Failed to unlike recipe. Please try again.');
    }
  };

  const getFilteredRecipes = () => {
    if (filter === 'all') return likedRecipes;
    
    // For now, we'll use mock filtering based on nutrition content
    // In a real app, recipes would have category tags
    return likedRecipes.filter(recipe => {
      switch (filter) {
        case 'breakfast':
          return recipe.nutrition.calories < 400; // Lighter meals for breakfast
        case 'lunch':
          return recipe.nutrition.calories >= 300 && recipe.nutrition.calories <= 500;
        case 'dinner':
          return recipe.nutrition.calories > 400;
        case 'snack':
          return recipe.nutrition.calories < 200;
        default:
          return true;
      }
    });
  };

  const renderFilterButton = (filterType: typeof filter, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === filterType ? theme.primary : theme.surface,
          borderColor: filter === filterType ? theme.primary : theme.border,
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Icon name={icon as any} size={16} color={filter === filterType ? '#fff' : theme.text} />
      <Text style={[
        textStyles.caption,
        { color: filter === filterType ? '#fff' : theme.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => handleViewRecipe(item)}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={[textStyles.subtitle, { color: theme.text }]}>
            Recipe #{item.id}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unlikeButton, { backgroundColor: theme.error }]}
          onPress={() => handleUnlikeRecipe(item.id)}
        >
          <Icon name="heart" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.recipeContent}>
        <Text style={[textStyles.body, { color: theme.text }]} numberOfLines={3}>
          {item.instructions}
        </Text>
      </View>

      <View style={styles.recipeFooter}>
        <View style={styles.nutritionInfo}>
          <View style={styles.nutritionItem}>
            <Icon name="fire" size={16} color={theme.warning} />
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.nutrition.calories} cal
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Icon name="dumbbell" size={16} color={theme.primary} />
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.nutrition.protein}g protein
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Icon name="food" size={16} color={theme.success} />
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.ingredients.length} ingredients
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.ingredientsPreview}>
        <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
          Key Ingredients:
        </Text>
        <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
          {item.ingredients.slice(0, 3).map(ing => ing.food_name).join(', ')}
          {item.ingredients.length > 3 && '...'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chef-hat" size={64} color={theme.textSecondary} />
      <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
        No Liked Recipes Yet
      </Text>
      <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
        Recipes you like will appear here. Start exploring to find delicious recipes!
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Forum' as never)}
      >
        <Icon name="forum" size={20} color="#fff" />
        <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
          Explore Recipes
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading your liked recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
            Error Loading Recipes
          </Text>
          <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadLikedRecipes}
          >
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredRecipes = getFilteredRecipes();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Liked Recipes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Buttons */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
          {renderFilterButton('all', 'All', 'format-list-bulleted')}
          {renderFilterButton('breakfast', 'Breakfast', 'coffee')}
          {renderFilterButton('lunch', 'Lunch', 'food')}
          {renderFilterButton('dinner', 'Dinner', 'silverware-fork-knife')}
          {renderFilterButton('snack', 'Snack', 'cookie')}
        </ScrollView>
      </View>

      {/* Recipes List */}
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterButtons: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  recipeCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  recipeInfo: {
    flex: 1,
  },
  unlikeButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  recipeContent: {
    marginBottom: SPACING.sm,
  },
  recipeFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ingredientsPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
});

export default LikedRecipesScreen;
