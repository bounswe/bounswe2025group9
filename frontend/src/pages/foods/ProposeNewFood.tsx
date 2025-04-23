import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';


interface MacronutrientData {
  carbohydrates: string;
  protein: string;
  fat: string;
}

interface MicronutrientData {
  [key: string]: string;
}

const ProposeNewFood: React.FC = () => {
  const navigate = useNavigate();
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [macronutrients, setMacronutrients] = useState<MacronutrientData>({
    carbohydrates: '',
    protein: '',
    fat: '',
  });
  const [micronutrients, setMicronutrients] = useState<MicronutrientData>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleMacronutrientChange = (field: keyof MacronutrientData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMacronutrients({
      ...macronutrients,
      [field]: event.target.value,
    });
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!foodName || !category || !calories || 
        !macronutrients.carbohydrates || !macronutrients.protein || !macronutrients.fat) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement API call to submit the food proposal
      setSuccess('Food proposal submitted successfully!');
      setTimeout(() => {
        navigate('/foods');
      }, 2000);
    } catch (err) {
      setError('Failed to submit food proposal. Please try again.');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <h1>Propose New Food</h1>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid size={{xs: 12}}>
                <TextField
                  required
                  fullWidth
                  label="Food Name"
                  value={foodName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoodName(e.target.value)}
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  required
                  fullWidth
                  label="Food Category"
                  value={category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
                />
              </Grid>

              <Grid size={{xs: 12, sm: 6}}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Calories (kcal)"
                  value={calories}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalories(e.target.value)}
                />
              </Grid>

              {/* Macronutrients */}
              <Grid size={{xs: 12}}>    
                <h2>
                  Macronutrients (per 100g)
                </h2>
              </Grid>

              <Grid size={{xs: 12, sm: 6}}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Carbohydrates (g)"
                  value={macronutrients.carbohydrates}
                  onChange={handleMacronutrientChange('carbohydrates')}
                />
              </Grid>

              <Grid size={{xs: 12, sm: 6}}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Protein (g)"
                  value={macronutrients.protein}
                  onChange={handleMacronutrientChange('protein')}
                />
              </Grid>

              <Grid size={{xs: 12, sm: 6}}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Fat (g)"
                  value={macronutrients.fat}
                  onChange={handleMacronutrientChange('fat')}
                />
              </Grid>


              {/* Submit Button */}
              <Grid size={{xs: 12}}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/foods')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Submit Proposal
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProposeNewFood;
