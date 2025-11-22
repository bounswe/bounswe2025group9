# Nutrition Tracking API Documentation

## Overview

This API provides endpoints for tracking user nutrition, including physical metrics, daily nutrition targets, food logging, and statistics.

**Base URL**: `http://localhost:8080/api`

**Authentication**: All endpoints require JWT authentication via Bearer token in the Authorization header.

---

## Authentication

### Get Access Token

**Endpoint**: `POST /users/token/`

**Request**:
```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

**Response**:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use the `access` token in subsequent requests:
```
Authorization: Bearer <access_token>
```

---

## User Metrics

### Get User Metrics

**Endpoint**: `GET /users/metrics/`

**Response**:
```json
{
  "height": "175.00",
  "weight": "70.00",
  "age": 30,
  "gender": "M",
  "activity_level": "moderate",
  "bmr": 1648.75,
  "tdee": 2555.56,
  "created_at": "2025-11-20T16:48:31.471038Z",
  "updated_at": "2025-11-20T16:48:31.471080Z"
}
```

**Status Codes**:
- `200 OK`: Metrics found
- `404 Not Found`: User has no metrics set

---

### Create/Update User Metrics

**Endpoint**: `POST /users/metrics/`

**Request**:
```json
{
  "height": 175,
  "weight": 70,
  "age": 30,
  "gender": "M",
  "activity_level": "moderate"
}
```

**Field Constraints**:
- `height`: 50-300 cm
- `weight`: 20-500 kg
- `age`: 1-150 years
- `gender`: "M" or "F"
- `activity_level`: "sedentary", "light", "moderate", "active", "very_active"

**Response**:
```json
{
  "height": "175.00",
  "weight": "70.00",
  "age": 30,
  "gender": "M",
  "activity_level": "moderate",
  "bmr": 1648.75,
  "tdee": 2555.56,
  "created_at": "2025-11-20T16:48:31.471038Z",
  "updated_at": "2025-11-20T16:48:31.471080Z"
}
```

**Notes**:
- BMR calculated using Mifflin-St Jeor equation
- TDEE = BMR × activity multiplier
- Automatically creates/updates nutrition targets if not custom

**Status Codes**:
- `200 OK`: Metrics created/updated successfully
- `400 Bad Request`: Validation error

---

## Nutrition Targets

### Get Nutrition Targets

**Endpoint**: `GET /users/nutrition-targets/`

**Response**:
```json
{
  "calories": "2555.56",
  "protein": "191.67",
  "carbohydrates": "255.56",
  "fat": "85.19",
  "micronutrients": {},
  "is_custom": false,
  "bmr": 1648.75,
  "tdee": 2555.56,
  "created_at": "2025-11-20T16:48:31.480321Z",
  "updated_at": "2025-11-20T16:48:31.480321Z"
}
```

**Notes**:
- Auto-generates from user metrics if not set
- Default macro ratio: 40% carbs, 30% protein, 30% fat
- `is_custom`: false = auto-calculated, true = manually set

**Status Codes**:
- `200 OK`: Targets found or auto-generated
- `404 Not Found`: No targets or metrics available

---

### Update Nutrition Targets

**Endpoint**: `PUT /users/nutrition-targets/`

**Request**:
```json
{
  "calories": 2000,
  "protein": 150,
  "carbohydrates": 200,
  "fat": 67,
  "micronutrients": {
    "Vitamin A": 900,
    "Vitamin C": 90,
    "Calcium": 1000
  }
}
```

**Response**:
```json
{
  "calories": "2000.00",
  "protein": "150.00",
  "carbohydrates": "200.00",
  "fat": "67.00",
  "micronutrients": {
    "Vitamin A": 900,
    "Vitamin C": 90,
    "Calcium": 1000
  },
  "is_custom": true,
  "bmr": 1648.75,
  "tdee": 2555.56,
  "created_at": "2025-11-20T16:48:31.480321Z",
  "updated_at": "2025-11-20T16:50:29.569917Z"
}
```

**Notes**:
- Automatically sets `is_custom` to true
- Validates that macro calories don't exceed total calories (5% margin allowed)
- Partial updates supported

**Status Codes**:
- `200 OK`: Targets updated successfully
- `400 Bad Request`: Validation error

---

### Reset Nutrition Targets

**Endpoint**: `POST /users/nutrition-targets/reset/`

**Response**:
```json
{
  "calories": "2555.56",
  "protein": "191.67",
  "carbohydrates": "255.56",
  "fat": "85.19",
  "micronutrients": {},
  "is_custom": false,
  "bmr": 1648.75,
  "tdee": 2555.56,
  "created_at": "2025-11-20T16:48:31.480321Z",
  "updated_at": "2025-11-20T16:50:44.031587Z"
}
```

**Notes**:
- Recalculates targets from current user metrics
- Sets `is_custom` to false
- Requires user to have metrics set

**Status Codes**:
- `200 OK`: Targets reset successfully
- `400 Bad Request`: User has no metrics

---

## Daily Nutrition Log

### Get Daily Log

**Endpoint**: `GET /meal-planner/daily-log/`

**Query Parameters**:
- `date` (optional): YYYY-MM-DD format, defaults to today

**Example**: `GET /meal-planner/daily-log/?date=2025-11-20`

**Response**:
```json
{
  "date": "2025-11-20",
  "total_calories": "550.00",
  "total_protein": "85.00",
  "total_carbohydrates": "45.00",
  "total_fat": "12.00",
  "micronutrients_summary": {
    "Vitamin A": 120,
    "Vitamin C": 45
  },
  "entries": [
    {
      "id": 1,
      "food_id": 1,
      "food_name": "Chicken Breast",
      "serving_size": "2.00",
      "serving_unit": "serving",
      "meal_type": "breakfast",
      "calories": "330.00",
      "protein": "62.00",
      "carbohydrates": "0.00",
      "fat": "7.00",
      "micronutrients": {},
      "logged_at": "2025-11-20T19:25:00Z"
    }
  ],
  "targets": {
    "calories": 2000,
    "protein": 150,
    "carbohydrates": 200,
    "fat": 67
  },
  "adherence": {
    "calories": 27.5,
    "protein": 56.7,
    "carbohydrates": 22.5,
    "fat": 17.9
  },
  "created_at": "2025-11-20T19:25:00Z",
  "updated_at": "2025-11-20T19:30:00Z"
}
```

**Notes**:
- Creates empty log if doesn't exist for the date
- Totals auto-calculated from entries
- Adherence = (consumed / target) × 100

**Status Codes**:
- `200 OK`: Log retrieved/created successfully
- `400 Bad Request`: Invalid date format

---

### Get Daily Log History

**Endpoint**: `GET /meal-planner/daily-log/history/`

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD, defaults to 7 days ago
- `end_date` (optional): YYYY-MM-DD, defaults to today

**Example**: `GET /meal-planner/daily-log/history/?start_date=2025-11-01&end_date=2025-11-20`

**Response**:
```json
[
  {
    "date": "2025-11-20",
    "total_calories": "550.00",
    "total_protein": "85.00",
    "total_carbohydrates": "45.00",
    "total_fat": "12.00",
    "micronutrients_summary": {}
  },
  {
    "date": "2025-11-19",
    "total_calories": "320.00",
    "total_protein": "40.00",
    "total_carbohydrates": "25.00",
    "total_fat": "8.00",
    "micronutrients_summary": {}
  }
]
```

**Notes**:
- Maximum 90-day range
- Ordered by date descending (newest first)
- Simplified format without nested entries

**Status Codes**:
- `200 OK`: History retrieved successfully

---

## Food Log Entries

### Add Food Entry

**Endpoint**: `POST /meal-planner/daily-log/entries/`

**Request**:
```json
{
  "food_id": 1,
  "serving_size": 2,
  "serving_unit": "serving",
  "meal_type": "breakfast",
  "date": "2025-11-20"
}
```

**Field Constraints**:
- `food_id`: Must exist in database
- `serving_size`: Must be > 0
- `meal_type`: "breakfast", "lunch", "dinner", "snack"
- `date` (optional): Defaults to today

**Response**:
```json
{
  "id": 1,
  "food_id": 1,
  "food_name": "Chicken Breast",
  "serving_size": "2.00",
  "serving_unit": "serving",
  "meal_type": "breakfast",
  "calories": "330.00",
  "protein": "62.00",
  "carbohydrates": "0.00",
  "fat": "7.00",
  "micronutrients": {},
  "logged_at": "2025-11-20T19:25:00Z"
}
```

**Notes**:
- Creates DailyNutritionLog if doesn't exist
- Nutrition values auto-calculated from food × serving_size
- Daily totals updated automatically

**Status Codes**:
- `201 Created`: Entry added successfully
- `400 Bad Request`: Validation error

---

### Update Food Entry

**Endpoint**: `PUT /meal-planner/daily-log/entries/{id}/`

**Request**:
```json
{
  "serving_size": 3,
  "meal_type": "dinner"
}
```

**Response**:
```json
{
  "id": 1,
  "food_id": 1,
  "food_name": "Chicken Breast",
  "serving_size": "3.00",
  "serving_unit": "serving",
  "meal_type": "dinner",
  "calories": "495.00",
  "protein": "93.00",
  "carbohydrates": "0.00",
  "fat": "10.50",
  "micronutrients": {},
  "logged_at": "2025-11-20T19:25:00Z"
}
```

**Notes**:
- Partial updates supported
- Nutrition values auto-recalculated
- Daily totals updated automatically
- Only owner can update (403 if not)

**Status Codes**:
- `200 OK`: Entry updated successfully
- `403 Forbidden`: Not the owner
- `404 Not Found`: Entry doesn't exist

---

### Delete Food Entry

**Endpoint**: `DELETE /meal-planner/daily-log/entries/{id}/`

**Response**: No content

**Notes**:
- Daily totals auto-recalculated after deletion
- Only owner can delete (403 if not)

**Status Codes**:
- `204 No Content`: Entry deleted successfully
- `403 Forbidden`: Not the owner
- `404 Not Found`: Entry doesn't exist

---

## Nutrition Statistics

### Get Statistics

**Endpoint**: `GET /meal-planner/nutrition-statistics/`

**Query Parameters**:
- `period` (optional): "week" or "month", defaults to "week"

**Example**: `GET /meal-planner/nutrition-statistics/?period=week`

**Response**:
```json
{
  "period": "week",
  "start_date": "2025-11-13",
  "end_date": "2025-11-20",
  "statistics": {
    "avg_calories": 650.5,
    "avg_protein": 95.2,
    "avg_carbohydrates": 45.0,
    "avg_fat": 12.3,
    "days_logged": 5,
    "streak_days": 3,
    "adherence": {
      "calories": 32.5,
      "protein": 63.5,
      "carbohydrates": 22.5,
      "fat": 18.4
    }
  }
}
```

**Notes**:
- `period`: "week" = 7 days, "month" = 30 days
- `streak_days`: Consecutive days with logs (from today backwards)
- `adherence`: Average percentage of targets met (if user has targets)

**Status Codes**:
- `200 OK`: Statistics retrieved successfully

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 400 Bad Request
```json
{
  "field_name": [
    "Error message describing the validation issue"
  ]
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to edit this entry."
}
```

### 404 Not Found
```json
{
  "detail": "User metrics not found."
}
```

---

## Complete Endpoint List

### User Metrics & Targets
- `POST /users/metrics/` - Create/update physical metrics
- `GET /users/metrics/` - Get user metrics
- `GET /users/nutrition-targets/` - Get nutrition targets
- `PUT /users/nutrition-targets/` - Update custom targets
- `POST /users/nutrition-targets/reset/` - Reset to auto-calculated

### Daily Nutrition Logging
- `GET /meal-planner/daily-log/` - Get today's or specific date log
- `GET /meal-planner/daily-log/history/` - Get date range logs
- `POST /meal-planner/daily-log/entries/` - Add food entry
- `PUT /meal-planner/daily-log/entries/{id}/` - Update entry
- `DELETE /meal-planner/daily-log/entries/{id}/` - Delete entry
- `GET /meal-planner/nutrition-statistics/` - Get statistics & streaks

---

## Calculation Formulas

### BMR (Basal Metabolic Rate)
Uses Mifflin-St Jeor Equation:
- **Men**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- **Women**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

### TDEE (Total Daily Energy Expenditure)
TDEE = BMR × Activity Multiplier

Activity Multipliers:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9

### Macro Distribution (Default)
- Carbohydrates: 40% of calories ÷ 4 kcal/g
- Protein: 30% of calories ÷ 4 kcal/g
- Fat: 30% of calories ÷ 9 kcal/g

### Adherence Percentage
Adherence = (consumed / target) × 100
