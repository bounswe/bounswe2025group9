# Affordable and Healthy Hub - Frontend

## Project Overview

The frontend of the Affordable and Healthy Hub project is a modern web application built to provide users with access to affordable and healthy food options. This application serves as the user interface for the platform, offering a seamless experience for discovering, browsing, and managing healthy food choices.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Project Setup

This project was created using Vite with React and TypeScript:

```bash
npm create vite@latest
# Select React and TypeScript (tsx) when prompted
```

### Tailwind CSS Setup

1. Install Tailwind CSS and its Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

2. Configure the Vite plugin in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

3. Import Tailwind CSS in your CSS file:

```css
@import "tailwindcss";
```

## Mock Service Worker (MSW) Setup

This project uses Mock Service Worker (MSW) to simulate API interactions during development, allowing the frontend to function without a backend.

### Installation and Setup

1. MSW is already installed as a dev dependency. If you need to reinstall:

   ```bash
   npm install msw --save-dev
   ```

2. **Important:** Generate the service worker file in your public directory:

   ```bash
   npx msw init public
   ```

   Without this step, you'll see the error: `"Failed to register a ServiceWorker... The script has an unsupported MIME type ('text/html')"`

3. MSW is automatically initialized in development mode in `src/main.tsx`

### Mock API Structure

The mock API is set up with the following components:

- `src/mocks/browser.ts` - Entry point for MSW in browser environment
- `src/mocks/handlers.ts` - API route handlers and business logic
- `src/mocks/data/` - JSON data files used by the handlers
  - `foods.json` - Mock food items with detailed nutritional information
  - `posts.json` - Mock forum posts

### Available Endpoints

The following mock API endpoints are available:

| Endpoint             | Method | Description                |
| -------------------- | ------ | -------------------------- |
| `/api/foods`         | GET    | Get list of food items     |
| `/api/posts`         | GET    | Get forum posts            |
| `/api/login`         | POST   | User login                 |
| `/api/signup`        | POST   | User registration          |
| `/api/foods/propose` | POST   | Submit a new food proposal |

### Using the API Client

A convenience API client is available in `src/lib/apiClient.ts` that handles the communication with these endpoints:

```typescript
import { apiClient } from "../lib/apiClient";

// Get all foods
const foods = await apiClient.getFoods();

// Get all forum posts
const posts = await apiClient.getPosts();

// Login
const userData = await apiClient.login("email@example.com", "password");

// Register
const newUser = await apiClient.signup(
  "email@example.com",
  "password",
  "username"
);

// Propose a new food
const proposal = {
  name: "Avocado",
  category: "Fruit",
  nutrition: {
    calories: 160,
    protein: 2,
    carbohydrates: 9,
    fat: 15,
    vitamins: {
      vitaminC: 10,
      vitaminE: 2.1,
    },
    minerals: {
      potassium: 485,
      magnesium: 29,
    },
  },
  dietaryTags: ["vegetarian", "vegan", "gluten-free"],
};

const result = await apiClient.proposeFood(proposal);
```

### How MSW Works

MSW intercepts outgoing requests in the browser and responds with mock data. This happens transparently to your application code. The initialization occurs in `src/main.tsx` and only activates in development mode.

### Adding New Endpoints

To add a new mock endpoint:

1. Add the route handler in `src/mocks/handlers.ts`
2. (Optional) Add corresponding data in `src/mocks/data/` if needed
3. Add the endpoint method to `src/lib/apiClient.ts`

### Testing with MSW

MSW is also ideal for testing. You can ensure your components correctly interact with APIs by testing against these same mock handlers.

### Food Data Structure

The food data structure follows these specifications:

```typescript
interface Food {
  id: number;
  name: string;
  category: string; // Fruit, Vegetable, Meat, Grain, etc.
  nutrition: {
    calories: number; // kcal per 100g
    protein: number; // g per 100g
    carbohydrates: number; // g per 100g
    fat: number; // g per 100g
    vitamins: Record<string, number>; // mg/μg per 100g
    minerals: Record<string, number>; // mg per 100g
  };
  nutritionScore: number; // Scale of 0.00-10.00
  dietaryTags: string[]; // vegetarian, vegan, gluten-free, etc.
  perUnit: string; // usually "100g"
  imageUrl: string; // URL to food image
}
```

#### Nutrition Score Calculation

The nutrition score (0.00-10.00) is calculated based on:

- Protein content (30% of score)
- Carbohydrate quality (30% of score)
- Nutrient balance (40% of score)

#### Supported Dietary Tags

The system supports these dietary options:

- `low-fat`
- `high-protein`
- `vegetarian`
- `vegan`
- `celiac-friendly`
- `gluten-free`
- `lactose-free`

#### Example Food Item

```json
{
  "id": 1,
  "name": "Apple",
  "category": "Fruit",
  "nutrition": {
    "calories": 52,
    "protein": 0.3,
    "carbohydrates": 13.8,
    "fat": 0.2,
    "vitamins": {
      "vitaminC": 4.6,
      "vitaminA": 3,
      "vitaminB6": 0.041
    },
    "minerals": {
      "potassium": 107,
      "calcium": 6,
      "iron": 0.12
    }
  },
  "nutritionScore": 7.2,
  "dietaryTags": ["vegetarian", "vegan", "gluten-free", "low-fat"],
  "perUnit": "100g",
  "imageUrl": "https://placehold.co/300x200/png"
}
```
