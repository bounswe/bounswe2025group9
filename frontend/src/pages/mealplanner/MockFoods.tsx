import {Food} from '../../lib/apiClient';

// Food data with real nutritional information from foods.json database

let Salmon: Food = {
  id: 104,
  name: "Salmon",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 146,
  proteinContent: 21.62,
  fatContent: 5.93,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["gluten-free", "keto-friendly", "pescatarian"],
  nutritionScore: 6.2,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/salmon.webp"
};

let Tofu: Food = {
  id: 105,
  name: "Organic Firm Tofu",
  category: "Protein",
  servingSize: 84,
  caloriesPerServing: 90,
  proteinContent: 9,
  fatContent: 4.5,
  carbohydrateContent: 3,
  allergens: ["soy"],
  dietaryOptions: ["vegan", "vegetarian", "gluten-free"],
  nutritionScore: 5.1,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/organic_firm_tofu.webp"
};

let BeefSteak: Food = {
  id: 106,
  name: "Beef Sirloin Steak",
  category: "Meat",
  servingSize: 100,
  caloriesPerServing: 250,
  proteinContent: 26,
  fatContent: 17,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 70,
  imageUrl: ""
};

let Shrimp: Food = {
  id: 107,
  name: "Boiled Shrimp",
  category: "Seafood",
  servingSize: 100,
  caloriesPerServing: 99,
  proteinContent: 24,
  fatContent: 0.3,
  carbohydrateContent: 0.2,
  allergens: ["shellfish"],
  dietaryOptions: ["pescatarian", "gluten-free", "low-fat"],
  nutritionScore: 83,
  imageUrl: ""
};

let Quinoa: Food = {
  id: 108,
  name: "Quinoa (Cooked)",
  category: "Grain",
  servingSize: 100,
  caloriesPerServing: 143,
  proteinContent: 5.01,
  fatContent: 2.22,
  carbohydrateContent: 26.35,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free", "high-fiber"],
  nutritionScore: 5.7,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/quinoa_cooked.webp"
};

let LentilSoup: Food = {
  id: 109,
  name: "Cooked Lentils",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 165,
  proteinContent: 8.39,
  fatContent: 6.76,
  carbohydrateContent: 18.73,
  allergens: [],
  dietaryOptions: ["vegan", "high-fiber", "low-fat"],
  nutritionScore: 5.27,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/cooked_lentils.webp"
};

let GreekYogurt: Food = {
  id: 196,
  name: "Plain Yogurt",
  category: "Dairy",
  servingSize: 100.0,
  caloriesPerServing: 63.0,
  proteinContent: 5.25,
  fatContent: 1.55,
  carbohydrateContent: 7.04,
  allergens: [],
  dietaryOptions: [],
  nutritionScore: 5.62,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/plain_yogurt.webp"
};

let BrownRice: Food = {
  id: 111,
  name: "Cooked Brown Rice",
  category: "Grain",
  servingSize: 100,
  caloriesPerServing: 111,
  proteinContent: 2.6,
  fatContent: 0.9,
  carbohydrateContent: 23,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 72,
  imageUrl: ""
};

let Avocado: Food = {
  id: 112,
  name: "Avocado",
  category: "Fruit",
  servingSize: 100,
  caloriesPerServing: 160,
  proteinContent: 2,
  fatContent: 15,
  carbohydrateContent: 9,
  allergens: [],
  dietaryOptions: ["vegan", "keto-friendly", "high-fiber"],
  nutritionScore: 88,
  imageUrl: ""
};

let Spinach: Food = {
  id: 113,
  name: "Cooked Spinach",
  category: "Vegetable",
  servingSize: 100,
  caloriesPerServing: 23,
  proteinContent: 3,
  fatContent: 0.3,
  carbohydrateContent: 3.8,
  allergens: [],
  dietaryOptions: ["vegan", "low-calorie", "high-iron"],
  nutritionScore: 90,
  imageUrl: ""
};

let Almonds: Food = {
  id: 114,
  name: "Raw Almonds",
  category: "Nut",
  servingSize: 28,
  caloriesPerServing: 164,
  proteinContent: 6,
  fatContent: 14,
  carbohydrateContent: 6,
  allergens: ["tree nuts"],
  dietaryOptions: ["vegan", "keto-friendly"],
  nutritionScore: 76,
  imageUrl: ""
};

let Egg: Food = {
  id: 184,
  name: "Egg",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 147,
  proteinContent: 12.58,
  fatContent: 9.94,
  carbohydrateContent: 0.77,
  allergens: ["egg"],
  dietaryOptions: ["keto-friendly", "high-protein"],
  nutritionScore: 5.29,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/egg.webp"
};

let Apple: Food = {
  id: 116,
  name: "Apple",
  category: "Fruit",
  servingSize: 182,
  caloriesPerServing: 95,
  proteinContent: 0.5,
  fatContent: 0.3,
  carbohydrateContent: 25,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 85,
  imageUrl: ""
};

let Oatmeal: Food = {
  id: 117,
  name: "Old Fashioned Oats",
  category: "Grain",
  servingSize: 40,
  caloriesPerServing: 150,
  proteinContent: 5,
  fatContent: 3,
  carbohydrateContent: 27,
  allergens: ["gluten"],
  dietaryOptions: ["vegetarian", "high-fiber"],
  nutritionScore: 6.45,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/old_fashioned_oats.webp"
};

let SweetPotato: Food = {
  id: 118,
  name: "Baked Sweet Potato",
  category: "Vegetable",
  servingSize: 130,
  caloriesPerServing: 112,
  proteinContent: 2,
  fatContent: 0.1,
  carbohydrateContent: 26,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 87,
  imageUrl: ""
};

let Broccoli: Food = {
  id: 119,
  name: "Broccoli",
  category: "Vegetable",
  servingSize: 100,
  caloriesPerServing: 34,
  proteinContent: 2.82,
  fatContent: 0.37,
  carbohydrateContent: 6.64,
  allergens: [],
  dietaryOptions: ["vegan", "low-calorie", "high-fiber"],
  nutritionScore: 6.88,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/broccoli.webp"
};

let PeanutButter: Food = {
  id: 120,
  name: "Peanut Butter (Natural)",
  category: "Nut Spread",
  servingSize: 32,
  caloriesPerServing: 190,
  proteinContent: 8,
  fatContent: 16,
  carbohydrateContent: 6,
  allergens: ["peanuts"],
  dietaryOptions: ["vegetarian", "keto-friendly"],
  nutritionScore: 70,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/peanut_butter.webp"
};

let CottageCheese: Food = {
  id: 121,
  name: "4% Small Curd Cottage Cheese",
  category: "Dairy",
  servingSize: 113,
  caloriesPerServing: 110,
  proteinContent: 13,
  fatContent: 5,
  carbohydrateContent: 5,
  allergens: ["milk"],
  dietaryOptions: ["vegetarian", "high-protein"],
  nutritionScore: 5.18,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/4%_small_curd_cottage_cheese.webp"
};

let Hummus: Food = {
  id: 122,
  name: "Hummus",
  category: "Dip/Legume",
  servingSize: 100,
  caloriesPerServing: 166,
  proteinContent: 8,
  fatContent: 10,
  carbohydrateContent: 14,
  allergens: ["sesame"],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 75,
  imageUrl: ""
};

let Tuna: Food = {
  id: 123,
  name: "Canned Tuna (in Water)",
  category: "Seafood",
  servingSize: 100,
  caloriesPerServing: 132,
  proteinContent: 28,
  fatContent: 1.3,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["pescatarian", "high-protein"],
  nutritionScore: 81,
  imageUrl: ""
};

let MixedSalad: Food = {
  id: 124,
  name: "Mixed Green Salad",
  category: "Vegetable",
  servingSize: 150,
  caloriesPerServing: 60,
  proteinContent: 2,
  fatContent: 3,
  carbohydrateContent: 7,
  allergens: [],
  dietaryOptions: ["vegan", "low-calorie"],
  nutritionScore: 89,
  imageUrl: ""
};

let Pork: Food = {
  id: 56,
  name: "Pork Chops (Top Loin, Boneless)",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 144,
  proteinContent: 21.35,
  fatContent: 5.89,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 6.17,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/pork_chops_top_loin_boneless.webp"
};
let Brocolli: Food = {
  id: 192,
  name: "Broccoli",
  category: "Legume/Plant-based",
  servingSize: 100, // g
  caloriesPerServing: 333,
  proteinContent: 13,  // g
  fatContent: 17,      // g
  carbohydrateContent: 31, // g
  allergens: ["sesame"], // often includes tahini; may contain gluten depending on recipe
  dietaryOptions: ["vegetarian", "vegan", "dairy-free", "high-fiber"],
  nutritionScore: 74,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/broccoli.webp"
};
let Goat: Food = {
  id: 211,
  name: "Goat Meat (Cooked, Roasted)",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 143,
  proteinContent: 27.1,
  fatContent: 3.03,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 7.41,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/goat_meat_cooked_roasted.webp"
};

let ChickenBreast: Food = {
  id: 68,
  name: "Chicken Breast",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 195,
  proteinContent: 29.55,
  fatContent: 7.72,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 6.99,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/chicken_breast.webp"
};

let Beef: Food = {
  id: 29,
  name: "Beef Steak",
  category: "Protein",
  servingSize: 100,
  caloriesPerServing: 252,
  proteinContent: 27.29,
  fatContent: 15.01,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 6.76,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/beef_steak.webp"
};

let RiceNoodles: Food = {
  id: 154,
  name: "Rice Noodles (Cooked)",
  category: "Grain",
  servingSize: 100,
  caloriesPerServing: 109,
  proteinContent: 0.91,
  fatContent: 0.2,
  carbohydrateContent: 24.9,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 4.62,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/rice_noodles_cooked.webp"
};

let Anchovies: Food = {
  id: 94,
  name: "Flat Anchovies in Olive Oil",
  category: "Protein",
  servingSize: 15,
  caloriesPerServing: 35,
  proteinContent: 4,
  fatContent: 2,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["pescatarian", "high-protein"],
  nutritionScore: 6.7,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/flat_anchovies_in_olive_oil.webp"
};

let Tilapia: Food = {
  id: 176,
  name: "Tilapia Fillets",
  category: "Protein",
  servingSize: 112,
  caloriesPerServing: 90,
  proteinContent: 20,
  fatContent: 2,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["pescatarian", "gluten-free", "low-fat"],
  nutritionScore: 6.09,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/tilapia_fillets.webp"
};

let RiceCakes: Food = {
  id: 223,
  name: "Rice Cakes - Lightly Salted",
  category: "Grain",
  servingSize: 9,
  caloriesPerServing: 40,
  proteinContent: 0.5,
  fatContent: 0,
  carbohydrateContent: 8,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 5.09,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/rice_cakes_-_lightly_salted.webp"
};

let MultigrainBread: Food = {
  id: 150,
  name: "Multigrain Bread",
  category: "Grain",
  servingSize: 100,
  caloriesPerServing: 251,
  proteinContent: 10,
  fatContent: 3.8,
  carbohydrateContent: 46.4,
  allergens: ["gluten"],
  dietaryOptions: ["vegetarian", "high-fiber"],
  nutritionScore: 6.2,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/multigrain_bread.webp"
};

let MockFoods: Food[] = [
  Salmon,
  Tofu,
  BeefSteak,
  Shrimp,
  Quinoa,
  LentilSoup,
  GreekYogurt,
  BrownRice,
  Avocado,
  Spinach,
  Almonds,
  Egg,
  Apple,
  Oatmeal,
  SweetPotato,
  Broccoli,
  PeanutButter,
  CottageCheese,
  Hummus,
  Tuna,
  MixedSalad,
  Pork,
  Brocolli,
  Goat,
  // Add the new foods here:
  ChickenBreast,
  Beef,
  RiceNoodles,
  Anchovies,
  Tilapia,
  RiceCakes,
  MultigrainBread
];

export { MockFoods, Brocolli, Goat, Pork, ChickenBreast, Beef, RiceNoodles, Anchovies, Tilapia, RiceCakes, MultigrainBread, Egg, Oatmeal, Tofu, LentilSoup, Quinoa, GreekYogurt, CottageCheese };


