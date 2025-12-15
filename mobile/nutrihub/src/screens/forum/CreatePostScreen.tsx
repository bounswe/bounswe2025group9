/**
 * CreatePostScreen
 * 
 * Screen for creating new forum posts (Nutrition Tips and Recipes).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { ForumStackParamList } from '../../navigation/types';
import { POST_TAGS } from '../../constants/forumConstants';
import { forumService, ApiTag, CreatePostRequest } from '../../services/api/forum.service';
import { getFoodCatalog, ApiFoodItem } from '../../services/api/food.service';

type CreatePostNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'CreatePost'>;

type PostType = 'nutrition' | 'recipe' | 'mealplan';

interface Ingredient {
  food_id: number;
  food_name: string;
  amount: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  
  // Post type selection
  const [postType, setPostType] = useState<PostType>('nutrition');
  
  // Nutrition tip form state
  const [nutritionTitle, setNutritionTitle] = useState('');
  const [nutritionContent, setNutritionContent] = useState('');
  const [nutritionTitleError, setNutritionTitleError] = useState<string | undefined>(undefined);
  const [nutritionContentError, setNutritionContentError] = useState<string | undefined>(undefined);
  const [nutritionTitleTouched, setNutritionTitleTouched] = useState(false);
  const [nutritionContentTouched, setNutritionContentTouched] = useState(false);
  const [isSubmittingNutrition, setIsSubmittingNutrition] = useState(false);
  
  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNameError, setRecipeNameError] = useState<string | undefined>(undefined);
  const [recipeInstructionsError, setRecipeInstructionsError] = useState<string | undefined>(undefined);
  const [recipeNameTouched, setRecipeNameTouched] = useState(false);
  const [recipeInstructionsTouched, setRecipeInstructionsTouched] = useState(false);
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);

  // Ingredient state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [foodSearchTerm, setFoodSearchTerm] = useState('');
  const [selectedFoodAmount, setSelectedFoodAmount] = useState('100');
  const [ingredientError, setIngredientError] = useState<string | undefined>(undefined);
  const [foodOptions, setFoodOptions] = useState<ApiFoodItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [loadingFoods, setLoadingFoods] = useState(false);
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagErrors, setTagErrors] = useState<string | undefined>(undefined);
  
  // Dietary tags for recipes (Vegan, Halal, High-Protein)
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<number[]>([]);
  
  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log('Fetching tags...');
        const tags = await forumService.getTags();
        console.log('Received tags:', tags);
        
        if (Array.isArray(tags) && tags.length > 0) {
          setAvailableTags(tags);
          setTagErrors(undefined);
        } else {
          console.error('Tags is empty or not an array:', tags);
          setAvailableTags([]);
          setTagErrors('Unable to load post tags. Some features may be limited.');
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
        setTagErrors('Failed to load post tags. Some features may be limited.');
        setAvailableTags([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTags();
  }, []);
  
  // Fetch foods when search term changes
  useEffect(() => {
    if (postType === 'recipe' && foodSearchTerm.length >= 2) {
      fetchFoods();
    } else {
      setFoodOptions([]);
    }
  }, [foodSearchTerm, postType]);
  
  // Fetch food options
  const fetchFoods = async () => {
    setLoadingFoods(true);
    try {
      const response = await getFoodCatalog(20, 0, undefined, foodSearchTerm);
      if (response.data) {
        // Transform FoodItem to ApiFoodItem format
        const apiFoods: ApiFoodItem[] = response.data.map(food => ({
          id: food.id,
          name: food.title,
          category: food.category,
          description: food.description,
          servingSize: 100,
          caloriesPerServing: food.macronutrients?.calories || 0,
          proteinContent: food.macronutrients?.protein || 0,
          fatContent: food.macronutrients?.fat || 0,
          carbohydrateContent: food.macronutrients?.carbohydrates || 0,
          fiberContent: food.macronutrients?.fiber,
          sugarContent: food.macronutrients?.sugar,
          nutritionScore: food.nutritionScore,
          imageUrl: food.imageUrl,
        }));
        setFoodOptions(apiFoods);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoadingFoods(false);
    }
  };
  
  // Validate nutrition title field
  const validateNutritionTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Title is required';
    } else if (value.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    return undefined;
  };
  
  // Validate nutrition content field
  const validateNutritionContent = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Content is required';
    } else if (value.trim().length < 10) {
      return 'Content must be at least 10 characters';
    }
    return undefined;
  };
  
  // Validate recipe name field
  const validateRecipeName = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Recipe name is required';
    } else if (value.trim().length < 3) {
      return 'Recipe name must be at least 3 characters';
    }
    return undefined;
  };
  
  // Validate recipe instructions field
  const validateRecipeInstructions = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Instructions are required';
    } else if (value.trim().length < 10) {
      return 'Instructions must be at least 10 characters';
    }
    return undefined;
  };
  
  // Handle nutrition title change
  const handleNutritionTitleChange = (value: string) => {
    setNutritionTitle(value);
    if (nutritionTitleTouched) {
      setNutritionTitleError(validateNutritionTitle(value));
    }
  };
  
  // Handle nutrition content change
  const handleNutritionContentChange = (value: string) => {
    setNutritionContent(value);
    if (nutritionContentTouched) {
      setNutritionContentError(validateNutritionContent(value));
    }
  };
  
  // Handle recipe name change
  const handleRecipeNameChange = (value: string) => {
    setRecipeName(value);
    if (recipeNameTouched) {
      setRecipeNameError(validateRecipeName(value));
    }
  };
  
  // Handle recipe instructions change
  const handleRecipeInstructionsChange = (value: string) => {
    setRecipeInstructions(value);
    if (recipeInstructionsTouched) {
      setRecipeInstructionsError(validateRecipeInstructions(value));
    }
  };
  
  // Handle nutrition title blur
  const handleNutritionTitleBlur = () => {
    setNutritionTitleTouched(true);
    setNutritionTitleError(validateNutritionTitle(nutritionTitle));
  };
  
  // Handle nutrition content blur
  const handleNutritionContentBlur = () => {
    setNutritionContentTouched(true);
    setNutritionContentError(validateNutritionContent(nutritionContent));
  };
  
  // Handle recipe name blur
  const handleRecipeNameBlur = () => {
    setRecipeNameTouched(true);
    setRecipeNameError(validateRecipeName(recipeName));
  };
  
  // Handle recipe instructions blur
  const handleRecipeInstructionsBlur = () => {
    setRecipeInstructionsTouched(true);
    setRecipeInstructionsError(validateRecipeInstructions(recipeInstructions));
  };
  
  // Helper function to get tag ID by name
  const getTagIdByName = (tagName: string): number | null => {
    if (!availableTags || !Array.isArray(availableTags) || availableTags.length === 0) {
      console.warn('availableTags is empty or not an array:', availableTags);
      return null;
    }
    
    // Try to find exact match first
    let tag = availableTags.find(t => t && t.name && t.name === tagName);
    
    // If no exact match, try case-insensitive
    if (!tag) {
      tag = availableTags.find(t => t && t.name && t.name.toLowerCase() === tagName.toLowerCase());
    }
    
    return tag ? tag.id : null;
  };
  
  // Validate nutrition tip form
  const validateNutritionForm = () => {
    // Force validation by setting touched states
    setNutritionTitleTouched(true);
    setNutritionContentTouched(true);
    
    // Validate fields
    const titleError = validateNutritionTitle(nutritionTitle);
    const contentError = validateNutritionContent(nutritionContent);
    
    // Update error states
    setNutritionTitleError(titleError);
    setNutritionContentError(contentError);
    
    return !titleError && !contentError;
  };
  
  // Validate recipe form
  const validateRecipeForm = () => {
    // Force validation by setting touched states
    setRecipeNameTouched(true);
    setRecipeInstructionsTouched(true);
    
    // Validate fields
    const nameError = validateRecipeName(recipeName);
    const instructionsError = validateRecipeInstructions(recipeInstructions);
    
    // Update error states
    setRecipeNameError(nameError);
    setRecipeInstructionsError(instructionsError);
    
    // Check ingredients
    if (ingredients.length === 0) {
      setIngredientError('At least one ingredient is required');
      return false;
    } else {
      setIngredientError(undefined);
    }
    
    return !nameError && !instructionsError && ingredients.length > 0;
  };
  
  // Handle nutrition tip submission
  const handleSubmitNutritionTip = async () => {
    // Validate form
    if (!validateNutritionForm()) {
      return;
    }
    
    // Find Dietary tip tag ID
    const dietaryTipTagId = getTagIdByName('Dietary tip');
    
    if (!dietaryTipTagId) {
      Alert.alert(
        'Tag Error',
        'Could not find the appropriate tag for Nutrition Tip. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Set loading state
    setIsSubmittingNutrition(true);
    
    try {
      const postData: CreatePostRequest = {
        title: nutritionTitle,
        body: nutritionContent,
        tag_ids: [dietaryTipTagId]
      };
      
      // Create post
      const createdPost = await forumService.createPost(postData);
      
      // Reset form
      setNutritionTitle('');
      setNutritionContent('');
      setNutritionTitleError(undefined);
      setNutritionContentError(undefined);
      setNutritionTitleTouched(false);
      setNutritionContentTouched(false);
      
      // Navigate back with new post
      navigation.navigate('ForumList', { 
        action: 'addPost',
        postData: {
          id: createdPost.id,
          title: createdPost.title,
          content: createdPost.content,
          author: createdPost.author,
          authorId: createdPost.authorId,
          commentsCount: createdPost.commentsCount,
          likesCount: createdPost.likesCount,
          isLiked: createdPost.isLiked || false,
          tags: createdPost.tags,
          createdAt: createdPost.createdAt.toISOString(),
          updatedAt: createdPost.updatedAt?.toISOString(),
        }
      });
      
      // Show success message
      Alert.alert('Success', 'Your nutrition tip has been posted!');
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmittingNutrition(false);
    }
  };
  
  // Handle recipe submission
  const handleSubmitRecipe = async () => {
    // Validate form
    if (!validateRecipeForm()) {
      return;
    }
    
    // Find Recipe tag ID
    const recipeTagId = getTagIdByName('Recipe');
    
    if (!recipeTagId) {
      Alert.alert(
        'Tag Error',
        'Could not find the appropriate tag for Recipe. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Set loading state
    setIsSubmittingRecipe(true);
    
    try {
      // Calculate total nutritional values
      const totalCalories = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
      const totalProtein = ingredients.reduce((sum, ing) => sum + ing.protein, 0);
      const totalFat = ingredients.reduce((sum, ing) => sum + ing.fat, 0);
      const totalCarbs = ingredients.reduce((sum, ing) => sum + ing.carbs, 0);
      
      // Format recipe content for the post body (similar to frontend)
      const recipeContent = `This is a recipe post.\n\nYou can find the full recipe details including ingredients and instructions below.`;
      
      // Combine recipe tag with dietary tags
      const allTagIds = [recipeTagId, ...selectedDietaryTags];
      
      const postData: CreatePostRequest = {
        title: recipeName,
        body: recipeContent,
        tag_ids: allTagIds
      };
      
      // Create post
      const createdPost = await forumService.createPost(postData);
      
      // Also create the recipe object using the dedicated recipe endpoint
      try {
        await forumService.createRecipe({
          post_id: createdPost.id,
          instructions: recipeInstructions,
          ingredients: ingredients.map(ing => ({
            food_id: ing.food_id,
            amount: ing.amount
          }))
        });
      } catch (recipeErr) {
        console.warn('Could not create dedicated recipe object:', recipeErr);
        // Continue since the post was still created
      }
      
      // Reset form and ingredients
      setRecipeName('');
      setRecipeInstructions('');
      setRecipeNameError(undefined);
      setRecipeInstructionsError(undefined);
      setRecipeNameTouched(false);
      setRecipeInstructionsTouched(false);
      setIngredients([]);
      setSelectedDietaryTags([]);
      
      // Navigate back with new post
      navigation.navigate('ForumList', { 
        action: 'addPost',
        postData: {
          id: createdPost.id,
          title: createdPost.title,
          content: createdPost.content,
          author: createdPost.author,
          authorId: createdPost.authorId,
          commentsCount: createdPost.commentsCount,
          likesCount: createdPost.likesCount,
          isLiked: createdPost.isLiked || false,
          tags: createdPost.tags,
          createdAt: createdPost.createdAt.toISOString(),
          updatedAt: createdPost.updatedAt?.toISOString(),
        }
      });
      
      // Show success message
      Alert.alert('Success', 'Your recipe has been posted!');
    } catch (err) {
      console.error('Error creating recipe post:', err);
      Alert.alert('Error', 'Failed to create recipe post. Please try again.');
    } finally {
      setIsSubmittingRecipe(false);
    }
  };
  
  // Handle adding ingredient
  const addIngredient = () => {
    // Validate food selection
    if (!selectedFoodId) {
      setIngredientError('Please select a food item');
      return;
    }
    
    const selectedFood = foodOptions.find(food => food.id === selectedFoodId);
    if (!selectedFood) {
      setIngredientError('Selected food not found');
      return;
    }
    
    // Validate amount
    const amount = parseFloat(selectedFoodAmount);
    if (isNaN(amount) || amount <= 0) {
      setIngredientError('Please enter a valid amount (greater than 0)');
      return;
    }
    
    // Check for duplicates
    if (ingredients.some(ing => ing.food_id === selectedFoodId)) {
      setIngredientError('This ingredient is already in your recipe');
      return;
    }
    
    // Calculate nutritional values based on amount (per 100g base)
    const ratio = amount / 100;
    
    // Add ingredient with nutritional info
    setIngredients([...ingredients, { 
      food_id: selectedFoodId,
      food_name: selectedFood.name,
      amount: amount,
      protein: selectedFood.proteinContent * ratio,
      fat: selectedFood.fatContent * ratio,
      carbs: selectedFood.carbohydrateContent * ratio,
      calories: selectedFood.caloriesPerServing * ratio,
    }]);
    
    // Clear ingredient error if it exists
    setIngredientError(undefined);
    
    // Clear input fields
    setSelectedFoodId(null);
    setFoodSearchTerm('');
    setSelectedFoodAmount('100'); // Reset to default
  };
  
  // Handle removing ingredient
  const removeIngredient = (foodId: number) => {
    setIngredients(ingredients.filter(ing => ing.food_id !== foodId));
    // If we're removing an ingredient but there are others left, clear the error
    if (ingredients.length > 1) {
      setIngredientError(undefined);
    }
  };
  
  // Toggle dietary tag selection (for recipes only)
  const toggleDietaryTag = (tagId: number) => {
    setSelectedDietaryTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };
  
  // Check if nutrition form is valid for enabling submit button
  const isNutritionFormValid = () => {
    return !nutritionTitleError && !nutritionContentError && 
           nutritionTitle.trim().length >= 3 && nutritionContent.trim().length >= 10;
  };
  
  // Check if recipe form is valid for enabling submit button
  const isRecipeFormValid = () => {
    return !recipeNameError && !recipeInstructionsError && 
           recipeName.trim().length >= 3 && recipeInstructions.trim().length >= 10 && 
           ingredients.length > 0;
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>{t('forum.createPost')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>{t('forum.createPost')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tag Error Warning */}
          {tagErrors && (
            <View style={[styles.tagErrorContainer, { backgroundColor: theme.errorContainerBg }]}>
              <Icon name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.tagErrorText, { color: theme.error }]}>
                {tagErrors}
              </Text>
            </View>
          )}
          
          {/* Post Type Selection */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>{t('forum.postType')}</Text>
            <View style={styles.postTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.postTypeButton,
                  postType === 'nutrition' && styles.postTypeButtonActive,
                  { borderColor: theme.border },
                  postType === 'nutrition' && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setPostType('nutrition')}
              >
                <Icon 
                  name="lightbulb-outline" 
                  size={24} 
                  color={postType === 'nutrition' ? '#FFFFFF' : theme.text} 
                />
                <Text 
                  style={[
                    styles.postTypeText, 
                    textStyles.body,
                    { color: postType === 'nutrition' ? '#FFFFFF' : theme.text }
                  ]}
                >
                  Nutrition Tip
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.postTypeButton,
                  postType === 'recipe' && styles.postTypeButtonActive,
                  { borderColor: theme.border },
                  postType === 'recipe' && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setPostType('recipe')}
              >
                <Icon 
                  name="chef-hat" 
                  size={24} 
                  color={postType === 'recipe' ? '#FFFFFF' : theme.text} 
                />
                <Text 
                  style={[
                    styles.postTypeText, 
                    textStyles.body,
                    { color: postType === 'recipe' ? '#FFFFFF' : theme.text }
                  ]}
                >
                  Recipe
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.postTypeButton,
                  postType === 'mealplan' && styles.postTypeButtonActive,
                  { borderColor: theme.border },
                  postType === 'mealplan' && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setPostType('mealplan')}
              >
                <Icon 
                  name="calendar-text" 
                  size={24} 
                  color={postType === 'mealplan' ? '#FFFFFF' : theme.text} 
                />
                <Text 
                  style={[
                    styles.postTypeText, 
                    textStyles.body,
                    { color: postType === 'mealplan' ? '#FFFFFF' : theme.text }
                  ]}
                >
                  Meal Plan
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
          
          {/* Conditional Forms */}
          {postType === 'nutrition' ? (
            /* Nutrition Tip Form */
            <Card style={styles.section}>
              <TextInput
                label="Title"
                placeholder="Enter your tip title"
                value={nutritionTitle}
                onChangeText={handleNutritionTitleChange}
                onBlur={handleNutritionTitleBlur}
                error={nutritionTitleError}
              />
              
              <TextInput
                label="Content"
                placeholder="Share your nutrition tip..."
                value={nutritionContent}
                onChangeText={handleNutritionContentChange}
                onBlur={handleNutritionContentBlur}
                error={nutritionContentError}
                multiline
                inputStyle={styles.contentInput}
              />
              
              <Button
                title="Post Nutrition Tip"
                onPress={handleSubmitNutritionTip}
                loading={isSubmittingNutrition}
                disabled={isSubmittingNutrition || !isNutritionFormValid()}
                fullWidth
              />
            </Card>
          ) : postType === 'recipe' ? (
            /* Recipe Form */
            <>
              <Card style={styles.section}>
                <TextInput
                  label="Recipe Name"
                  placeholder="Enter recipe name"
                  value={recipeName}
                  onChangeText={handleRecipeNameChange}
                  onBlur={handleRecipeNameBlur}
                  error={recipeNameError}
                />
              </Card>
              
              {/* Recipe Details summary (always visible in Recipe mode) */}
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Recipe Details</Text>
                <View style={[styles.nutritionSummary, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Icon name="fire" size={20} color="#EF4444" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {ingredients.reduce((sum, ing) => sum + ing.calories, 0).toFixed(0)}
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="weight-lifter" size={20} color="#3B82F6" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {ingredients.reduce((sum, ing) => sum + ing.protein, 0).toFixed(1)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="water" size={20} color="#F59E0B" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {ingredients.reduce((sum, ing) => sum + ing.fat, 0).toFixed(1)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Fat</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Icon name="grain" size={20} color="#10B981" />
                      <Text style={[styles.nutritionValue, textStyles.body]}>
                        {ingredients.reduce((sum, ing) => sum + ing.carbs, 0).toFixed(1)}g
                      </Text>
                      <Text style={[styles.nutritionLabel, textStyles.caption]}>Carbs</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Dietary Tags - only show for Recipe */}
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>
                  {t('forum.dietaryTags')} <Text style={[styles.optionalLabel, textStyles.caption]}>({t('common.optional')})</Text>
                </Text>
                <View style={styles.dietaryTagsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dietaryTagButton,
                      { borderColor: theme.border },
                      selectedDietaryTags.includes(getTagIdByName('Vegan') || 0) && 
                        { backgroundColor: '#10B981', borderColor: '#10B981' }
                    ]}
                    onPress={() => {
                      const veganTagId = getTagIdByName('Vegan');
                      if (veganTagId) toggleDietaryTag(veganTagId);
                    }}
                  >
                    <Icon 
                      name="leaf" 
                      size={18} 
                      color={selectedDietaryTags.includes(getTagIdByName('Vegan') || 0) ? '#FFFFFF' : theme.text} 
                    />
                    <Text 
                      style={[
                        styles.dietaryTagText, 
                        textStyles.body,
                        { color: selectedDietaryTags.includes(getTagIdByName('Vegan') || 0) ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      Vegan
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.dietaryTagButton,
                      { borderColor: theme.border },
                      selectedDietaryTags.includes(getTagIdByName('Halal') || 0) && 
                        { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                    ]}
                    onPress={() => {
                      const halalTagId = getTagIdByName('Halal');
                      if (halalTagId) toggleDietaryTag(halalTagId);
                    }}
                  >
                    <Icon 
                      name="star-crescent" 
                      size={18} 
                      color={selectedDietaryTags.includes(getTagIdByName('Halal') || 0) ? '#FFFFFF' : theme.text} 
                    />
                    <Text 
                      style={[
                        styles.dietaryTagText, 
                        textStyles.body,
                        { color: selectedDietaryTags.includes(getTagIdByName('Halal') || 0) ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      Halal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.dietaryTagButton,
                      { borderColor: theme.border },
                      selectedDietaryTags.includes(getTagIdByName('High-Protein') || 0) && 
                        { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                    ]}
                    onPress={() => {
                      const highProteinTagId = getTagIdByName('High-Protein');
                      if (highProteinTagId) toggleDietaryTag(highProteinTagId);
                    }}
                  >
                    <Icon 
                      name="dumbbell" 
                      size={18} 
                      color={selectedDietaryTags.includes(getTagIdByName('High-Protein') || 0) ? '#FFFFFF' : theme.text} 
                    />
                    <Text 
                      style={[
                        styles.dietaryTagText, 
                        textStyles.body,
                        { color: selectedDietaryTags.includes(getTagIdByName('High-Protein') || 0) ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      High-Protein
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
              
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Ingredients</Text>
                
                {/* Ingredient Addition Form */}
                <View style={styles.ingredientInputRow}>
                  <View style={styles.ingredientNameInputContainer}>
                    <TextInput
                      placeholder="Search for ingredients..."
                      value={foodSearchTerm}
                      onChangeText={setFoodSearchTerm}
                      containerStyle={styles.ingredientNameInput}
                      iconName="food-apple"
                    />
                  </View>
                  
                  <View style={styles.ingredientAmountInputContainer}>
                    <TextInput
                      placeholder="100"
                      value={selectedFoodAmount}
                      onChangeText={setSelectedFoodAmount}
                      keyboardType="numeric"
                      containerStyle={styles.ingredientAmountInput}
                    />
                  </View>
                  
                  <Button
                    title="Add"
                    variant="primary"
                    onPress={addIngredient}
                    style={styles.addIngredientButton}
                    iconName="plus"
                    disabled={!selectedFoodId}
                  />
                </View>
                
                {/* Food Search Results */}
                {foodSearchTerm.length >= 2 && (
                  <View style={[styles.foodSearchResults, { borderColor: theme.border }]}>
                    {loadingFoods ? (
                      <View style={styles.foodSearchLoading}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text style={[styles.foodSearchLoadingText, textStyles.caption]}>Loading foods...</Text>
                      </View>
                    ) : foodOptions.length === 0 ? (
                      <Text style={[styles.noFoodsText, textStyles.caption]}>
                        No foods found. Try a different search term.
                      </Text>
                    ) : (
                      <ScrollView style={styles.foodSearchList} nestedScrollEnabled>
                        {foodOptions.map(food => (
                          <TouchableOpacity
                            key={food.id}
                            style={[
                              styles.foodSearchItem,
                              { borderBottomColor: theme.border },
                              selectedFoodId === food.id && { backgroundColor: theme.surfaceVariant }
                            ]}
                            onPress={() => setSelectedFoodId(food.id)}
                          >
                            <View style={styles.foodSearchItemContent}>
                              <Text style={[styles.foodSearchItemName, textStyles.body]}>{food.name}</Text>
                              <Text style={[styles.foodSearchItemDetails, textStyles.caption]}>
                                {food.category} • {food.proteinContent}g protein • {food.fatContent}g fat • {food.carbohydrateContent}g carbs • {food.caloriesPerServing} cal
                              </Text>
                            </View>
                            {selectedFoodId === food.id && (
                              <Icon name="check-circle" size={20} color={theme.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
                
                {/* Ingredient Error */}
                {ingredientError && (
                  <Text style={[styles.ingredientErrorText, { color: theme.error }]}>
                    {ingredientError}
                  </Text>
                )}
                
                {/* Total Nutritional Information */}
                {ingredients.length > 0 && (
                  <View style={[styles.nutritionSummary, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                    <Text style={[styles.nutritionSummaryTitle, textStyles.subtitle]}>Total Nutrition</Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, textStyles.body]}>{ingredients.reduce((sum, ing) => sum + ing.calories, 0).toFixed(1)}</Text>
                        <Text style={[styles.nutritionLabel, textStyles.caption]}>Calories</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, textStyles.body]}>{ingredients.reduce((sum, ing) => sum + ing.protein, 0).toFixed(1)}g</Text>
                        <Text style={[styles.nutritionLabel, textStyles.caption]}>Protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, textStyles.body]}>{ingredients.reduce((sum, ing) => sum + ing.fat, 0).toFixed(1)}g</Text>
                        <Text style={[styles.nutritionLabel, textStyles.caption]}>Fat</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, textStyles.body]}>{ingredients.reduce((sum, ing) => sum + ing.carbs, 0).toFixed(1)}g</Text>
                        <Text style={[styles.nutritionLabel, textStyles.caption]}>Carbs</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Ingredients List */}
                <View style={styles.ingredientsListContainer}>
                  <Text style={[styles.ingredientsListTitle, textStyles.subtitle]}>Selected Ingredients:</Text>
                  {ingredients.map((ingredient) => (
                    <View key={ingredient.food_id} style={[styles.ingredientItem, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                      <View style={styles.ingredientInfo}>
                        <Text style={[styles.ingredientName, textStyles.body]}>{ingredient.food_name}</Text>
                        <Text style={[styles.ingredientAmount, textStyles.caption]}>
                          {ingredient.amount}g ({ingredient.protein.toFixed(1)}g protein, {ingredient.fat.toFixed(1)}g fat, {ingredient.carbs.toFixed(1)}g carbs)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeIngredient(ingredient.food_id)}
                        style={styles.removeButton}
                      >
                        <Icon name="close-circle" size={20} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {ingredients.length === 0 && (
                  <Text style={[styles.noIngredientsText, textStyles.caption]}>
                    No ingredients added yet. Add ingredients to continue.
                  </Text>
                )}
              </Card>
              
              <Card style={styles.section}>
                <TextInput
                  label="Instructions"
                  placeholder="Enter cooking instructions..."
                  value={recipeInstructions}
                  onChangeText={handleRecipeInstructionsChange}
                  onBlur={handleRecipeInstructionsBlur}
                  error={recipeInstructionsError}
                  multiline
                  inputStyle={styles.contentInput}
                />
                
                <Button
                  title="Post Recipe"
                  onPress={handleSubmitRecipe}
                  loading={isSubmittingRecipe}
                  disabled={isSubmittingRecipe || !isRecipeFormValid()}
                  fullWidth
                />
              </Card>
            </>
          ) : (
            /* Meal Plan Form - Not implemented yet */
            <Card style={styles.section}>
              <View style={styles.comingSoonContainer}>
                <Icon name="calendar-clock" size={48} color={theme.textSecondary} />
                <Text style={[styles.comingSoonTitle, textStyles.heading4]}>Coming Soon!</Text>
                <Text style={[styles.comingSoonText, textStyles.body]}>
                  Meal plan creation is not yet available. Check back later for this feature!
                </Text>
                <Button
                  title="Go Back"
                  onPress={() => setPostType('nutrition')}
                  variant="primary"
                  style={styles.comingSoonButton}
                />
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  tagErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  tagErrorText: {
    marginLeft: SPACING.sm,
    flex: 1,
    fontSize: 14,
  },
  postTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  postTypeButtonActive: {},
  postTypeText: {
    fontWeight: '500',
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  ingredientNameInputContainer: {
    flex: 2,
  },
  ingredientNameInput: {
    marginBottom: 0,
  },
  ingredientAmountInputContainer: {
    width: 80,
    marginHorizontal: SPACING.xs,
  },
  ingredientAmountInput: {
    marginBottom: 0,
  },
  addIngredientButton: {
    marginLeft: SPACING.xs,
    alignSelf: 'flex-end',
  },
  ingredientErrorText: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  ingredientsListContainer: {
    marginTop: SPACING.xs,
  },
  ingredientName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  ingredientItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientAmount: {
    opacity: 0.7,
  },
  removeButton: {
    padding: 2,
  },
  noIngredientsText: {
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  comingSoonTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  comingSoonText: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  comingSoonButton: {
    minWidth: 150,
  },
  optionalLabel: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  dietaryTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dietaryTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  dietaryTagText: {
    fontWeight: '500',
  },
  foodSearchResults: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    maxHeight: 250,
    overflow: 'hidden',
  },
  foodSearchLoading: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  foodSearchLoadingText: {
    marginTop: SPACING.xs,
  },
  noFoodsText: {
    padding: SPACING.md,
    textAlign: 'center',
  },
  foodSearchList: {
    maxHeight: 250,
  },
  foodSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  foodSearchItemContent: {
    flex: 1,
  },
  foodSearchItemName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  foodSearchItemDetails: {
    opacity: 0.7,
  },
  nutritionSummary: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  nutritionSummaryTitle: {
    marginBottom: SPACING.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  nutritionLabel: {
    marginTop: 2,
    opacity: 0.7,
  },
  ingredientsListTitle: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
});

export default CreatePostScreen;