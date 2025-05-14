import React, { useState} from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FoodProposal, apiClient } from '../../lib/apiClient';

// Add proper types for MUI components

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// Available dietary options
const dietaryOptions = [
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


const ProposeNewFood: React.FC = () => {
  const navigate = useNavigate();
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!foodName.trim()) errors.foodName = 'Food name is required';
    if (!category.trim()) errors.category = 'Category is required';
    if (!servingSize || isNaN(Number(servingSize)) || Number(servingSize) <= 0) 
      errors.servingSize = 'Valid serving size is required';
    if (!calories || isNaN(Number(calories)) || Number(calories) < 0) 
      errors.calories = 'Valid calorie count is required';
    if (!protein || isNaN(Number(protein)) || Number(protein) < 0) 
      errors.protein = 'Valid protein content is required';
    if (!carbs || isNaN(Number(carbs)) || Number(carbs) < 0) 
      errors.carbs = 'Valid carbohydrate content is required';
    if (!fat || isNaN(Number(fat)) || Number(fat) < 0) 
      errors.fat = 'Valid fat content is required';
    
    if (imageUrl && !isValidUrl(imageUrl)) 
      errors.imageUrl = 'Please enter a valid URL';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const calculateNutritionScore = () => {
    // Simple nutrition score calculation (this would be more sophisticated in a real app)
    const proteinValue = Number(protein);
    const carbsValue = Number(carbs);
    const fatValue = Number(fat);
    const caloriesValue = Number(calories);
    
    // Basic formula: higher protein is good, balanced macros are good
    const proteinScore = proteinValue * 4;
    const balanceScore = 100 - Math.abs((carbsValue * 4) - (fatValue * 9)) / caloriesValue * 100;
    
    return Math.round((proteinScore + balanceScore) / 2);
  };

  const handleDietaryOptionsChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setSelectedDietaryOptions(
      typeof value === 'string' ? value.split(',') : value,
    );
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const nutritionScore = calculateNutritionScore();
      
      const proposal: FoodProposal = {
        name: foodName,
        category: category,
        servingSize: Number(servingSize),
        caloriesPerServing: Number(calories),
        proteinContent: Number(protein),
        fatContent: Number(fat),
        carbohydrateContent: Number(carbs),
        dietaryOptions: selectedDietaryOptions,
        nutritionScore: nutritionScore,
        imageUrl: imageUrl || undefined,
      };
      
      await apiClient.proposeFood(proposal);
      setSuccess('Food proposal submitted successfully!');
      
      // Clear form or redirect after success
      setTimeout(() => {
        navigate('/foods');
      }, 2000);
    } catch (err) {
      console.error('Error submitting food proposal:', err);
      setError(`Failed to submit food proposal. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <h1 className="nh-title text-center mb-4">Propose New Food</h1>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Box>
                <TextField
                  required
                  fullWidth
                  label="Food Name"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  error={!!validationErrors.foodName}
                  helperText={validationErrors.foodName}
                />
              </Box>

              <Box>
                <TextField
                  required
                  fullWidth
                  label="Food Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  error={!!validationErrors.category}
                  helperText={validationErrors.category}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Serving Size (g)"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    error={!!validationErrors.servingSize}
                    helperText={validationErrors.servingSize}
                  />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Calories per Serving"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    error={!!validationErrors.calories}
                    helperText={validationErrors.calories}
                  />
                </Box>
              </Box>

              {/* Macronutrients */}
              <Box>    
                <h2 className="nh-subtitle">
                  Macronutrients (per serving)
                </h2>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Carbohydrates (g)"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    error={!!validationErrors.carbs}
                    helperText={validationErrors.carbs}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Protein (g)"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    error={!!validationErrors.protein}
                    helperText={validationErrors.protein}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Fat (g)"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    error={!!validationErrors.fat}
                    helperText={validationErrors.fat}
                  />
                </Box>
              </Box>
              

              <Box>    
                <h2 className="nh-subtitle">
                  Dietary Information
                </h2>
              </Box>

              <Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel id="dietary-options-label">Dietary Options</InputLabel>
                    <Select
                      labelId="dietary-options-label"
                      multiple
                      value={selectedDietaryOptions}
                      onChange={handleDietaryOptionsChange}
                      input={<OutlinedInput label="Dietary Options" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {dietaryOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          <Checkbox checked={selectedDietaryOptions.indexOf(option) > -1} />
                          <ListItemText primary={option} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              {/* Image URL */}
              <Box>
                <TextField
                  fullWidth
                  label="Image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  error={!!validationErrors.imageUrl}
                  helperText={validationErrors.imageUrl || "Provide a URL to an image of this food (optional)"}
                />
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/foods')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProposeNewFood;
