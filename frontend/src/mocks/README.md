# Mock Service API

This directory contains mock API implementations using [Mock Service Worker (MSW)](https://mswjs.io/) for local development.

## Available Mock Endpoints

### GET /api/foods

Returns a list of foods with nutritional information.

### GET /api/posts

Returns a list of forum posts.

### POST /api/login

Authenticates a user.

**Request Body:**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser"
}
```

### POST /api/signup

Registers a new user.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser"
}
```

**Response:**

```json
{
  "id": 2,
  "email": "newuser@example.com",
  "username": "newuser"
}
```

### POST /api/foods/propose

Proposes a new food to be added to the database.

**Request Body:**

```json
{
  "name": "Example Superfood",
  "category": "Vegetables",
  "nutrition": {
    "calories": 120,
    "protein": 15,
    "carbohydrates": 10,
    "fat": 3
  },
  "dietaryTags": ["Vegan", "Gluten-Free"]
}
```

**Response:**

```json
{
  "message": "Food proposal submitted successfully",
  "proposalId": 1234567890,
  "nutritionScore": 7.5
}
```

### POST /api/like

Likes a food or post item.

**Request Body:**

```json
{
  "itemId": 1,
  "itemType": "food"
}
```

**Response:**

```json
{
  "itemId": 1,
  "itemType": "food",
  "likes": 1,
  "message": "Successfully liked food with id 1"
}
```

### GET /api/likes/:type/:id

Gets the number of likes for a specific item.

**Parameters:**

- `type`: Either "foods" or "posts"
- `id`: The ID of the item

**Response:**

```json
{
  "itemId": 1,
  "itemType": "foods",
  "likes": 5
}
```

## How to Use

The mock service worker is automatically initialized in development environments.
You can see example usage in the `/api-examples` page.

### Using the API Client

The project includes a dedicated API client (`src/lib/apiClient.ts`) that provides typed methods for interacting with these endpoints:

```typescript
// examples
import { apiClient } from "../lib/apiClient";

// get all foods
const foods = await apiClient.getFoods();

// login a user
const user = await apiClient.login("email@example.com", "password123");

// propose a new food
const response = await apiClient.proposeFood({
  name: "New Food",
  category: "Vegetables",
  nutrition: {
    calories: 100,
    protein: 10,
    carbohydrates: 5,
    fat: 2,
  },
});

// like a food
const likeResponse = await apiClient.likeItem(1, "food");

// get likes for a post
const postLikes = await apiClient.getItemLikes("posts", 2);
```

## Adding New Mock Endpoints

To add new mock endpoints:

1. Update the `handlers.ts` file with your new endpoint handler
2. Add any required mock data in the `data/` directory
3. Update the `apiClient.ts` file with methods to access your new endpoint
4. Update this README with the new endpoint details
