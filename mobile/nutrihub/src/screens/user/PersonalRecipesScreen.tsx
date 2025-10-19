import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Recipe, ForumTopic } from '../../types/types';

const PersonalRecipesScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's personal recipes on mount
  useEffect(() => {
    loadPersonalRecipes();
  }, []);

  const loadPersonalRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const userRecipes = await recipeService.getPersonalRecipes();
      // setRecipes(userRecipes);
      
      // Mock data for now
      const mockRecipes: Recipe[] = [
        {
          id: 1,
          post_id: 101,
          instructions: "1. Preheat oven to 350°F\n2. Mix ingredients in a bowl\n3. Bake for 25 minutes",
          ingredients: [
            { food_id: 1, food_name: "Flour", amount: 200 },
            { food_id: 2, food_name: "Sugar", amount: 100 },
            { food_id: 3, food_name: "Eggs", amount: 2 }
          ],
          nutrition: {
            calories: 350,
            protein: 8,
            carbs: 45,
            fat: 12
          },
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z"
        },
        {
          id: 2,
          post_id: 102,
          instructions: "1. Heat oil in a pan\n2. Add vegetables and cook for 10 minutes\n3. Season to taste",
          ingredients: [
            { food_id: 4, food_name: "Broccoli", amount: 150 },
            { food_id: 5, food_name: "Carrots", amount: 100 },
            { food_id: 6, food_name: "Olive Oil", amount: 15 }
          ],
          nutrition: {
            calories: 120,
            protein: 4,
            carbs: 15,
            fat: 5
          },
          created_at: "2024-01-10T14:30:00Z",
          updated_at: "2024-01-10T14:30:00Z"
        }
      ];
      setRecipes(mockRecipes);
    } catch (err) {
      console.error('Error loading personal recipes:', err);
      setError('Failed to load your recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateRecipe = () => {
    // TODO: Navigate to create recipe screen
    Alert.alert('Create Recipe', 'Navigate to recipe creation screen');
  };

  const handleEditRecipe = (recipe: Recipe) => {
    // TODO: Navigate to edit recipe screen
    Alert.alert('Edit Recipe', `Edit recipe: ${recipe.id}`);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await recipeService.deleteRecipe(recipe.id);
              setRecipes(prev => prev.filter(r => r.id !== recipe.id));
              Alert.alert('Success', 'Recipe deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  const handleViewRecipe = (recipe: Recipe) => {
    // TODO: Navigate to recipe detail screen
    Alert.alert('View Recipe', `View recipe: ${recipe.id}`);
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <View style={[styles.recipeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={[textStyles.subtitle, { color: theme.text }]}>
            Recipe #{item.id}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleViewRecipe(item)}
          >
            <Icon name="eye" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => handleEditRecipe(item)}
          >
            <Icon name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            onPress={() => handleDeleteRecipe(item)}
          >
            <Icon name="delete" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
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
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chef-hat" size={64} color={theme.textSecondary} />
      <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
        No Recipes Yet
      </Text>
      <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
        Start creating your personal recipe collection
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateRecipe}
      >
        <Icon name="plus" size={20} color="#fff" />
        <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
          Create Your First Recipe
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading your recipes...</Text>
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
            onPress={loadPersonalRecipes}
          >
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>My Recipes</Text>
        <TouchableOpacity onPress={handleCreateRecipe} style={styles.createButton}>
          <Icon name="plus" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={recipes}
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
  createButton: {
    padding: SPACING.sm,
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
  recipeActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
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
  separator: {
    height: SPACING.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  createButton: {
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

export default PersonalRecipesScreen;
