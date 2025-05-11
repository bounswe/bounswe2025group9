/**
 * CreatePostScreen
 * 
 * Screen for creating new forum posts (Nutrition Tips and Recipes).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import useForm from '../../hooks/useForm';
import { ForumStackParamList } from '../../navigation/types';
import { POST_TAGS } from '../../constants/forumConstants';

type CreatePostNavigationProp = NativeStackNavigationProp<ForumStackParamList, 'CreatePost'>;

type PostType = 'nutrition' | 'recipe';

interface NutritionTipFormData {
  title: string;
  content: string;
}

interface RecipeFormData {
  recipeName: string;
  instructions: string;
}

interface Ingredient {
  id: number;
  name: string;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { theme, textStyles } = useTheme();
  
  const [postType, setPostType] = useState<PostType>('nutrition');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  
  // Nutrition tip form
  const nutritionForm = useForm<NutritionTipFormData>({
    initialValues: {
      title: '',
      content: '',
    },
    validationRules: {
      title: [
        { validator: (value) => value.trim().length > 0, message: 'Title is required' },
        { validator: (value) => value.trim().length >= 3, message: 'Title must be at least 3 characters' },
      ],
      content: [
        { validator: (value) => value.trim().length > 0, message: 'Content is required' },
        { validator: (value) => value.trim().length >= 10, message: 'Content must be at least 10 characters' },
      ],
    },
    onSubmit: async (values) => {
      navigation.navigate('ForumList', { 
        action: 'addPost',
        postData: {
          id: Date.now(),
          title: values.title,
          content: values.content,
          author: 'currentUser',
          authorId: 999,
          commentsCount: 0,
          likesCount: 0,
          isLiked: false,
          tags: [POST_TAGS.NUTRITION_TIP],
          createdAt: new Date().toISOString(),
        }
      });
    },
  });
  
  // Recipe form
  const recipeForm = useForm<RecipeFormData>({
    initialValues: {
      recipeName: '',
      instructions: '',
    },
    validationRules: {
      recipeName: [
        { validator: (value) => value.trim().length > 0, message: 'Recipe name is required' },
        { validator: (value) => value.trim().length >= 3, message: 'Recipe name must be at least 3 characters' },
      ],
      instructions: [
        { validator: (value) => value.trim().length > 0, message: 'Instructions are required' },
        { validator: (value) => value.trim().length >= 10, message: 'Instructions must be at least 10 characters' },
      ],
    },
    onSubmit: async (values) => {
      if (ingredients.length === 0) {
        Alert.alert('Error', 'Please add at least one ingredient');
        return;
      }
      
      // Format recipe content
      const recipeContent = `Ingredients:\n${ingredients.map(ing => `• ${ing.name}`).join('\n')}\n\nInstructions:\n${values.instructions}`;
      
      navigation.navigate('ForumList', { 
        action: 'addPost',
        postData: {
          id: Date.now(),
          title: values.recipeName,
          content: recipeContent,
          author: 'currentUser',
          authorId: 999,
          commentsCount: 0,
          likesCount: 0,
          isLiked: false,
          tags: [POST_TAGS.RECIPE],
          createdAt: new Date().toISOString(),
        }
      });
    },
  });
  
  // Handle adding ingredient
  const addIngredient = () => {
    if (ingredientSearch.trim()) {
      setIngredients([...ingredients, { id: Date.now(), name: ingredientSearch.trim() }]);
      setIngredientSearch('');
    }
  };
  
  // Handle removing ingredient
  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
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
            </View>
          </Card>
          
          {/* Conditional Forms */}
          {postType === 'nutrition' ? (
            /* Nutrition Tip Form */
            <Card style={styles.section}>
              <TextInput
                label="Title"
                placeholder="Enter your tip title"
                value={nutritionForm.values.title}
                onChangeText={nutritionForm.handleChange('title')}
                onBlur={nutritionForm.handleBlur('title')}
                error={nutritionForm.touched.title ? nutritionForm.errors.title : undefined}
              />
              
              <TextInput
                label="Content"
                placeholder="Share your nutrition tip..."
                value={nutritionForm.values.content}
                onChangeText={nutritionForm.handleChange('content')}
                onBlur={nutritionForm.handleBlur('content')}
                error={nutritionForm.touched.content ? nutritionForm.errors.content : undefined}
                multiline
                inputStyle={styles.contentInput}
              />
              
              <Button
                title="Post Nutrition Tip"
                onPress={nutritionForm.handleSubmit}
                loading={nutritionForm.isSubmitting}
                disabled={!nutritionForm.isValid || nutritionForm.isSubmitting}
                fullWidth
              />
            </Card>
          ) : (
            /* Recipe Form */
            <>
              <Card style={styles.section}>
                <TextInput
                  label="Recipe Name"
                  placeholder="Enter recipe name"
                  value={recipeForm.values.recipeName}
                  onChangeText={recipeForm.handleChange('recipeName')}
                  onBlur={recipeForm.handleBlur('recipeName')}
                  error={recipeForm.touched.recipeName ? recipeForm.errors.recipeName : undefined}
                />
              </Card>
              
              <Card style={styles.section}>
                <View style={styles.ingredientsHeader}>
                  <Text style={[styles.sectionTitle, textStyles.subtitle]}>Ingredients</Text>
                  <Button
                    title="Add Ingredient"
                    onPress={addIngredient}
                    variant="primary"
                    size="small"
                    iconName="plus"
                    disabled={!ingredientSearch.trim()}
                  />
                </View>
                
                <View style={styles.ingredientSearchContainer}>
                  <TextInput
                    placeholder="Search for an ingredient..."
                    value={ingredientSearch}
                    onChangeText={setIngredientSearch}
                    onSubmitEditing={addIngredient}
                    returnKeyType="done"
                    containerStyle={styles.ingredientSearchInput}
                    iconName="magnify"
                  />
                </View>
                
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <Text style={[styles.ingredientName, textStyles.body]}>{ingredient.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeIngredient(ingredient.id)}
                      style={styles.removeButton}
                    >
                      <Icon name="minus" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {ingredients.length === 0 && (
                  <Text style={[styles.noIngredientsText, textStyles.caption]}>
                    No ingredients added yet
                  </Text>
                )}
              </Card>
              
              <Card style={styles.section}>
                <TextInput
                  label="Instructions"
                  placeholder="Enter cooking instructions..."
                  value={recipeForm.values.instructions}
                  onChangeText={recipeForm.handleChange('instructions')}
                  onBlur={recipeForm.handleBlur('instructions')}
                  error={recipeForm.touched.instructions ? recipeForm.errors.instructions : undefined}
                  multiline
                  inputStyle={styles.contentInput}
                />
                
                <Button
                  title="Post Recipe"
                  onPress={recipeForm.handleSubmit}
                  loading={recipeForm.isSubmitting}
                  disabled={!recipeForm.isValid || recipeForm.isSubmitting}
                  fullWidth
                />
              </Card>
            </>
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
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
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
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ingredientSearchContainer: {
    marginBottom: SPACING.md,
  },
  ingredientSearchInput: {
    marginBottom: 0,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  ingredientName: {
    flex: 1,
  },
  removeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  noIngredientsText: {
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
});

export default CreatePostScreen;