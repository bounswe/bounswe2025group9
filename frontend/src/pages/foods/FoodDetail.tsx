import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Box,
} from '@mui/material';
import { Food } from '../../lib/apiClient';

interface FoodDetailProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
}

const FoodDetail: React.FC<FoodDetailProps> = ({ food, open, onClose }) => {
  if (!food) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="nh-title">
        {food.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={{xs: 12}}>
              <Typography variant="h6" className="nh-subtitle">
                Basic Information
              </Typography>
              <Typography className="nh-text">
                Category: {food.category}
              </Typography>
              <Typography className="nh-text">
                Nutrition Score: {food.nutritionScore}
              </Typography>
              <Typography className="nh-text">
                Per Unit: {food.perUnit}
              </Typography>
            </Grid>

            <Grid size={{xs: 12}}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Nutrition Information */}
            <Grid size={{xs: 12}}>
              <Typography variant="h6" className="nh-subtitle">
                Nutrition Information (per 100g)
              </Typography>
            </Grid>

            <Grid size={{xs: 12, sm: 6}}>
              <Typography className="nh-text">
                Calories: {food.nutrition.calories} kcal
              </Typography>
            </Grid>

            <Grid size={{xs: 12, sm: 6}}>
              <Typography className="nh-text">
                Carbohydrates: {food.nutrition.carbohydrates}g
              </Typography>
            </Grid>

            <Grid size={{xs: 12, sm: 6}}>
              <Typography className="nh-text">
                Protein: {food.nutrition.protein}g
              </Typography>
            </Grid>

            <Grid size={{xs: 12, sm: 6}}>
              <Typography className="nh-text">
                Fat: {food.nutrition.fat}g
              </Typography>
            </Grid>

            {/* Dietary Tags */}
            <Grid size={{xs: 12}}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" className="nh-subtitle">
                Dietary Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {food.dietaryTags.map((tag) => (
                  <Typography 
                    key={tag}
                    className="nh-text"
                    sx={{ 
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {tag}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className="nh-button-secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodDetail;
