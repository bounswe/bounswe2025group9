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

| Endpoint               | Method | Description                       |
| ---------------------- | ------ | --------------------------------- |
| `/api/foods`           | GET    | Get list of food items with likes |
| `/api/posts`           | GET    | Get forum posts with likes        |
| `/api/login`           | POST   | User login                        |
| `/api/signup`          | POST   | User registration                 |
| `/api/foods/propose`   | POST   | Submit a new food proposal        |
| `/api/like`            | POST   | Like a food or post item          |
| `/api/likes/:type/:id` | GET    | Get number of likes for an item   |

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

// Like a food item
const likeResponse = await apiClient.likeItem(1, "food");

// Get likes for a post
const postLikes = await apiClient.getItemLikes("posts", 2);
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

## Unit Testing with Vitest

This project uses Vitest and React Testing Library for unit testing. Here's how to write and run tests for your components.

### Setup

The testing environment is already configured with:

- Vitest for test running
- React Testing Library for component testing
- Jest DOM for DOM-specific assertions
- MSW for API mocking

### Writing Tests

#### Basic Component Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import YourComponent from "./YourComponent";

describe("YourComponent", () => {
  it("renders correctly", () => {
    render(
      <BrowserRouter>
        <YourComponent />
      </BrowserRouter>
    );

    // Test assertions here
  });
});
```

#### Testing Page Components

When testing page components:

1. Always wrap with `BrowserRouter` if using React Router
2. Test for presence of main elements
3. Verify navigation links
4. Check responsive layouts
5. Test component interactions

Example for a page component:

```typescript
describe("Foods Page", () => {
  it("renders food list and search functionality", () => {
    render(
      <BrowserRouter>
        <FoodsPage />
      </BrowserRouter>
    );

    // Test main elements
    expect(screen.getByText("Food List")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search foods...")).toBeInTheDocument();

    // Test navigation
    const addFoodLink = screen.getByText("Add Food").closest("a");
    expect(addFoodLink).toHaveAttribute("href", "/foods/add");

    // Test responsive layout
    const container = screen.getByTestId("food-list-container");
    expect(container).toHaveClass("grid", "grid-cols-1", "md:grid-cols-2");
  });
});
```

#### Testing API Interactions

Use MSW to mock API calls in tests:

```typescript
import { setupServer } from "msw/node";
import { rest } from "msw";

const server = setupServer(
  rest.get("/api/foods", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
      ])
    );
  })
);

describe("FoodList Component", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads and displays foods", async () => {
    render(<FoodList />);

    // Wait for data to load
    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
  });
});
```

#### Testing User Interactions

Test user interactions using React Testing Library's fireEvent:

```typescript
import { fireEvent } from "@testing-library/react";

describe("Search Component", () => {
  it("updates search results on input change", () => {
    render(<SearchComponent />);

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "apple" } });

    expect(input).toHaveValue("apple");
  });
});
```

#### Testing Responsive Design

Test responsive layouts by checking Tailwind classes:

```typescript
describe("Responsive Layout", () => {
  it("applies correct responsive classes", () => {
    render(<YourComponent />);

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveClass("flex", "flex-col", "md:flex-row");
  });
});
```

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests for a specific file:

```bash
npm test -- src/pages/Home.test.tsx
```

### Best Practices

1. **Test Structure**

   - Group related tests using `describe`
   - Use clear, descriptive test names
   - Follow the pattern: "should [expected behavior] when [condition]"

2. **Component Testing**

   - Test what the user sees, not implementation details
   - Use semantic queries (getByRole, getByText) over test IDs
   - Mock external dependencies

3. **API Testing**

   - Use MSW for API mocking
   - Test both success and error cases
   - Verify loading states

4. **Accessibility**

   - Test for proper ARIA attributes
   - Ensure keyboard navigation works
   - Verify screen reader compatibility

5. **Performance**
   - Keep tests focused and fast
   - Use async utilities properly
   - Clean up after tests

### Common Test Patterns

#### Testing Navigation

```typescript
it("navigates to correct route", () => {
  render(
    <MemoryRouter>
      <YourComponent />
    </MemoryRouter>
  );

  const link = screen.getByText("Some Link").closest("a");
  expect(link).toHaveAttribute("href", "/expected-route");
});
```

#### Testing Form Submissions

```typescript
it("handles form submission", async () => {
  render(<YourForm />);

  const input = screen.getByLabelText("Username");
  fireEvent.change(input, { target: { value: "testuser" } });

  const submitButton = screen.getByRole("button", { name: "Submit" });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });
});
```

#### Testing Error States

```typescript
it("displays error message on API failure", async () => {
  server.use(
    rest.get("/api/data", (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(<YourComponent />);

  await waitFor(() => {
    expect(screen.getByText("Error loading data")).toBeInTheDocument();
  });
});
```
