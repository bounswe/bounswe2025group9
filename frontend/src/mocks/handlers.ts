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

interface LikeRequest {
  itemId: number;
  itemType: "food" | "post";
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

// track likes for foods and posts
const likes = {
  foods: new Map<number, number>(),
  posts: new Map<number, number>(),
};

// initialize likes for existing foods and posts
foods.forEach((food) => {
  likes.foods.set(food.id, 0);
});

posts.forEach((post) => {
  likes.posts.set(post.id, post.likes || 0);
});

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
    // add the current like count to each food
    const foodsWithLikes = foods.map((food) => ({
      ...food,
      likes: likes.foods.get(food.id) || 0,
    }));

    return HttpResponse.json(foodsWithLikes);
  }),

  // GET /api/posts
  http.get("/api/posts", () => {
    // add the current like count to each post
    const postsWithLikes = posts.map((post) => ({
      ...post,
      likes: likes.posts.get(post.id) || 0,
    }));

    return HttpResponse.json(postsWithLikes);
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

  // POST /api/like
  http.post("/api/like", async ({ request }) => {
    const { itemId, itemType } = (await request.json()) as LikeRequest;

    // validate request
    if (!itemId || !itemType || !["food", "post"].includes(itemType)) {
      return new HttpResponse(null, {
        status: 400,
        statusText: "Invalid request parameters",
      });
    }

    // get the likes map for the item type
    const likesMap = itemType === "food" ? likes.foods : likes.posts;

    // check if item exists
    if (!likesMap.has(itemId)) {
      return new HttpResponse(null, {
        status: 404,
        statusText: "Item not found",
      });
    }

    // increment like count
    const currentLikes = likesMap.get(itemId) || 0;
    likesMap.set(itemId, currentLikes + 1);

    return HttpResponse.json({
      itemId,
      itemType,
      likes: currentLikes + 1,
      message: `Successfully liked ${itemType} with id ${itemId}`,
    });
  }),

  // GET /api/likes/:type/:id
  http.get("/api/likes/:type/:id", ({ params }) => {
    const { type, id } = params;
    const itemId = parseInt(id as string);

    // validate params
    if (isNaN(itemId) || !["foods", "posts"].includes(type as string)) {
      return new HttpResponse(null, {
        status: 400,
        statusText: "Invalid parameters",
      });
    }

    // get the likes map for the item type
    const likesMap = type === "foods" ? likes.foods : likes.posts;

    // check if item exists
    if (!likesMap.has(itemId)) {
      return new HttpResponse(null, {
        status: 404,
        statusText: "Item not found",
      });
    }

    return HttpResponse.json({
      itemId,
      itemType: type,
      likes: likesMap.get(itemId) || 0,
    });
  }),
];
