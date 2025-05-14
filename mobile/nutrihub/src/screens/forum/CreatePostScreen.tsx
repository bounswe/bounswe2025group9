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
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { ForumStackParamList } from '../../navigation/types';
import { POST_TAGS } from '../../constants/forumConstants';
import { forumService, ApiTag, CreatePostRequest } from '../../services/api/forum.service';

type CreatePostNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'CreatePost'>;

type PostType = 'nutrition' | 'recipe' | 'mealplan';

interface Ingredient {
  id: number;
  name: string;
  amount: number;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { theme, textStyles } = useTheme();
  
  // Post type selection
  const [postType, setPostType] = useState<PostType>('nutrition');
  
  // Nutrition tip form state
  const [nutritionTitle, setNutritionTitle] = useState('');
  const [nutritionContent, setNutritionContent] = useState('');
  const [nutritionTitleError, setNutritionTitleError] = useState<string | undefined>(undefined);
  const [nutritionContentError, setNutritionContentError] = useState<string | undefined>(undefined);
  const [isSubmittingNutrition, setIsSubmittingNutrition] = useState(false);
  
  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNameError, setRecipeNameError] = useState<string | undefined>(undefined);
  const [recipeInstructionsError, setRecipeInstructionsError] = useState<string | undefined>(undefined);
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);

  // Ingredient state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('100');
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagErrors, setTagErrors] = useState<string | undefined>(undefined);
  
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
    let isValid = true;
    
    // Validate title
    if (!nutritionTitle.trim()) {
      setNutritionTitleError('Title is required');
      isValid = false;
    } else if (nutritionTitle.trim().length < 3) {
      setNutritionTitleError('Title must be at least 3 characters');
      isValid = false;
    } else {
      setNutritionTitleError(undefined);
    }
    
    // Validate content
    if (!nutritionContent.trim()) {
      setNutritionContentError('Content is required');
      isValid = false;
    } else if (nutritionContent.trim().length < 10) {
      setNutritionContentError('Content must be at least 10 characters');
      isValid = false;
    } else {
      setNutritionContentError(undefined);
    }
    
    return isValid;
  };
  
  // Validate recipe form
  const validateRecipeForm = () => {
    let isValid = true;
    
    // Validate recipe name
    if (!recipeName.trim()) {
      setRecipeNameError('Recipe name is required');
      isValid = false;
    } else if (recipeName.trim().length < 3) {
      setRecipeNameError('Recipe name must be at least 3 characters');
      isValid = false;
    } else {
      setRecipeNameError(undefined);
    }
    
    // Validate instructions
    if (!recipeInstructions.trim()) {
      setRecipeInstructionsError('Instructions are required');
      isValid = false;
    } else if (recipeInstructions.trim().length < 10) {
      setRecipeInstructionsError('Instructions must be at least 10 characters');
      isValid = false;
    } else {
      setRecipeInstructionsError(undefined);
    }
    
    // Validate ingredients
    if (ingredients.length === 0) {
      Alert.alert('Missing Ingredients', 'Please add at least one ingredient to your recipe.');
      isValid = false;
    }
    
    return isValid;
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
      // Format recipe content for the post body
      const recipeContent = `Ingredients:\n${ingredients.map(ing => `• ${ing.name} (${ing.amount}g)`).join('\n')}\n\nInstructions:\n${recipeInstructions}`;
      
      const postData: CreatePostRequest = {
        title: recipeName,
        body: recipeContent,
        tag_ids: [recipeTagId]
      };
      
      // Create post
      const createdPost = await forumService.createPost(postData);
      
      // Also create the recipe object using the dedicated recipe endpoint if available
      try {
        // This would use the recipe-specific endpoint we saw in the Postman collection
        await forumService.createRecipe({
          post_id: createdPost.id,
          instructions: recipeInstructions,
          ingredients: ingredients.map(ing => ({
            food_id: ing.id, // This might need adjustment based on your food catalog
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
      setIngredients([]);
      
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
    // Validate ingredient name
    if (!ingredientName.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }
    
    // Validate amount
    const amount = parseFloat(ingredientAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount (greater than 0)');
      return;
    }
    
    // Check for duplicates
    if (ingredients.some(ing => ing.name.toLowerCase() === ingredientName.trim().toLowerCase())) {
      Alert.alert('Duplicate Ingredient', 'This ingredient is already in your recipe. You can remove it and add it again if you need to change the amount.');
      return;
    }
    
    // Add ingredient
    setIngredients([...ingredients, { 
      id: Date.now(), 
      name: ingredientName.trim(),
      amount: amount
    }]);
    
    // Clear input fields
    setIngredientName('');
    setIngredientAmount('100'); // Reset to default
  };
  
  // Handle removing ingredient
  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles.heading3]}>Create New Post</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>Loading...</Text>
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
          <Text style={[styles.headerTitle, textStyles.heading3]}>Create New Post</Text>
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
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>Post Type</Text>
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
                onChangeText={setNutritionTitle}
                error={nutritionTitleError}
              />
              
              <TextInput
                label="Content"
                placeholder="Share your nutrition tip..."
                value={nutritionContent}
                onChangeText={setNutritionContent}
                error={nutritionContentError}
                multiline
                inputStyle={styles.contentInput}
              />
              
              <Button
                title="Post Nutrition Tip"
                onPress={handleSubmitNutritionTip}
                loading={isSubmittingNutrition}
                disabled={isSubmittingNutrition || !nutritionTitle.trim() || !nutritionContent.trim()}
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
                  onChangeText={setRecipeName}
                  error={recipeNameError}
                />
              </Card>
              
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>Ingredients</Text>
                
                {/* Ingredient Addition Form - Updated to match the image */}
                <View style={styles.ingredientInputRow}>
                  <View style={styles.ingredientNameInputContainer}>
                    <TextInput
                      placeholder="Search for ingredients..."
                      value={ingredientName}
                      onChangeText={setIngredientName}
                      containerStyle={styles.ingredientNameInput}
                      iconName="food-apple"
                    />
                  </View>
                  
                  <View style={styles.ingredientAmountInputContainer}>
                    <TextInput
                      placeholder="100"
                      value={ingredientAmount}
                      onChangeText={setIngredientAmount}
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
                    disabled={!ingredientName.trim()}
                  />
                </View>
                
                {/* Ingredients List */}
                <View style={styles.ingredientsListContainer}>
                  {ingredients.map((ingredient) => (
                    <View key={ingredient.id} style={[styles.ingredientItem, { backgroundColor: theme.surfaceVariant }]}>
                      <Text style={[styles.ingredientName, textStyles.body]}>{ingredient.name}</Text>
                      <View style={styles.ingredientItemRight}>
                        <Text style={[styles.ingredientAmount, textStyles.body]}>{ingredient.amount}g</Text>
                        <TouchableOpacity
                          onPress={() => removeIngredient(ingredient.id)}
                          style={styles.removeButton}
                        >
                          <Icon name="close-circle" size={20} color={theme.error} />
                        </TouchableOpacity>
                      </View>
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
                  onChangeText={setRecipeInstructions}
                  error={recipeInstructionsError}
                  multiline
                  inputStyle={styles.contentInput}
                />
                
                <Button
                  title="Post Recipe"
                  onPress={handleSubmitRecipe}
                  loading={isSubmittingRecipe}
                  disabled={isSubmittingRecipe || !recipeName.trim() || !recipeInstructions.trim() || ingredients.length === 0}
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
  ingredientsListContainer: {
    marginTop: SPACING.xs,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  ingredientName: {
    flex: 1,
  },
  ingredientItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientAmount: {
    marginRight: SPACING.sm,
    fontWeight: '500',
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
});

export default CreatePostScreen;