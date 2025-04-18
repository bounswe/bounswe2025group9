import { http, HttpResponse } from "msw";
import foods from "./data/foods.json";
import posts from "./data/posts.json";

// define interface for user
interface User {
  id: number;
  email: string;
  username: string;
  password: string;
}

// define interfaces for request bodies
interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

interface ProposeFoodRequest {
  name: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
  };
  dietaryTags?: string[];
  imageUrl?: string;
}

// mock user database
const users: User[] = [
  {
    id: 1,
    email: "test@example.com",
    username: "testuser",
    password: "password123",
  },
];

// food proposal queue (would be reviewed by moderators in real app)
const foodProposals: ProposeFoodRequest[] = [];

// nutrition score calculation function (simplified version)
function calculateNutritionScore(food: ProposeFoodRequest): number {
  // protein score (30% of total) - higher protein is better
  const proteinScore = Math.min(food.nutrition.protein / 30, 1) * 3;

  // carb quality score (30% of total) - simplistic, favors lower carbs
  const carbScore = Math.max(0, 3 - food.nutrition.carbohydrates / 30);

  // nutrient balance (40% of total) - simplified version
  const nutrientBalanceScore =
    Math.min(
      ((food.nutrition.vitamins
        ? Object.keys(food.nutrition.vitamins).length
        : 0) +
        (food.nutrition.minerals
          ? Object.keys(food.nutrition.minerals).length
          : 0)) /
        6,
      1
    ) * 4;

  // sum and round to 1 decimal place
  return (
    Math.round((proteinScore + carbScore + nutrientBalanceScore) * 10) / 10
  );
}

export const handlers = [
  // GET /api/foods
  http.get("/api/foods", () => {
    return HttpResponse.json(foods);
  }),

  // GET /api/posts
  http.get("/api/posts", () => {
    return HttpResponse.json(posts);
  }),

  // POST /api/login
  http.post("/api/login", async ({ request }) => {
    const { email, password } = (await request.json()) as LoginRequest;

    const user = users.find(
      (user) => user.email === email && user.password === password
    );

    if (!user) {
      return new HttpResponse(null, {
        status: 401,
        statusText: "Invalid credentials",
      });
    }

    return HttpResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }),

  // POST /api/signup
  http.post("/api/signup", async ({ request }) => {
    const { email, password, username } =
      (await request.json()) as SignupRequest;

    // Check if user already exists
    if (users.some((user) => user.email === email)) {
      return new HttpResponse(null, {
        status: 409,
        statusText: "User already exists",
      });
    }

    // In a real app, we would store the user, but for our mock
    // we'll just return a success response
    return HttpResponse.json(
      {
        id: users.length + 1,
        email,
        username,
      },
      { status: 201 }
    );
  }),

  // POST /api/foods/propose
  http.post("/api/foods/propose", async ({ request }) => {
    const foodProposal = (await request.json()) as ProposeFoodRequest;

    // Validate required fields
    if (
      !foodProposal.name ||
      !foodProposal.category ||
      !foodProposal.nutrition ||
      foodProposal.nutrition.calories === undefined ||
      foodProposal.nutrition.protein === undefined ||
      foodProposal.nutrition.carbohydrates === undefined ||
      foodProposal.nutrition.fat === undefined
    ) {
      return new HttpResponse(null, {
        status: 400,
        statusText: "Missing required fields",
      });
    }

    // Set defaults for optional fields
    if (!foodProposal.dietaryTags) {
      foodProposal.dietaryTags = [];
    }

    // Calculate nutrition score
    const nutritionScore = calculateNutritionScore(foodProposal);

    // Add to proposals queue
    const proposalWithMetadata = {
      ...foodProposal,
      nutritionScore,
      proposalId: Date.now(),
      status: "pending",
      perUnit: "100g", // default unit
    };

    foodProposals.push(foodProposal);

    return HttpResponse.json(
      {
        message: "Food proposal submitted successfully",
        proposalId: proposalWithMetadata.proposalId,
        nutritionScore,
      },
      { status: 201 }
    );
  }),
];
