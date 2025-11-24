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
  id: 1433,
  name: "Soybean curd",
  category: "Soy and meat-alternative products",
  servingSize: 248,
  caloriesPerServing: 151.3,
  proteinContent: 17.8,
  fatContent: 9.2,
  carbohydrateContent: 2.9,
  allergens: ["soy"],
  dietaryOptions: ["vegan", "vegetarian", "gluten-free"],
  nutritionScore: 4.75,
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
  id: 2154,
  name: "Quinoa, no added fat",
  category: "Pasta, noodles, cooked grains",
  servingSize: 170,
  caloriesPerServing: 204,
  proteinContent: 7.4,
  fatContent: 3.2,
  carbohydrateContent: 36,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free", "high-fiber"],
  nutritionScore: 5.64,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/quinoa_cooked.webp"
};

let LentilSoup: Food = {
  id: 1426,
  name: "Lentils, from dried, no added fat",
  category: "Beans, peas, legumes",
  servingSize: 180,
  caloriesPerServing: 207,
  proteinContent: 16.1,
  fatContent: 0.7,
  carbohydrateContent: 36,
  allergens: [],
  dietaryOptions: ["vegan", "high-fiber", "low-fat"],
  nutritionScore: 5.59,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/cooked_lentils.webp"
};

let GreekYogurt: Food = {
  id: 275,
  name: "Yogurt, Greek, NS as to type of milk, plain",
  category: "Yogurt, Greek",
  servingSize: 150,
  caloriesPerServing: 100.5,
  proteinContent: 15.3,
  fatContent: 2,
  carbohydrateContent: 5.4,
  allergens: [],
  dietaryOptions: [],
  nutritionScore: 5.32,
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
  id: 1276,
  name: "Egg, whole, cooked, NS as to cooking method",
  category: "Eggs and omelets",
  servingSize: 50,
  caloriesPerServing: 88,
  proteinContent: 5.9,
  fatContent: 7,
  carbohydrateContent: 0.5,
  allergens: ["egg"],
  dietaryOptions: ["keto-friendly", "high-protein"],
  nutritionScore: 5.61,
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
  id: 2139,
  name: "Oatmeal, regular or quick, made with water, no added fat",
  category: "Oatmeal",
  servingSize: 240,
  caloriesPerServing: 153.6,
  proteinContent: 5.3,
  fatContent: 2.6,
  carbohydrateContent: 27.4,
  allergens: ["gluten"],
  dietaryOptions: ["vegetarian", "high-fiber"],
  nutritionScore: 4.92,
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
  id: 554,
  name: "Cottage cheese, farmer's",
  category: "Cottage/ricotta cheese",
  servingSize: 210,
  caloriesPerServing: 310.8,
  proteinContent: 23.1,
  fatContent: 20.4,
  carbohydrateContent: 9.1,
  allergens: ["milk"],
  dietaryOptions: ["vegetarian", "high-protein"],
  nutritionScore: 5.53,
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
  id: 647,
  name: "Pork, chop, lean and fat eaten",
  category: "Pork",
  servingSize: 90,
  caloriesPerServing: 175.5,
  proteinContent: 24.3,
  fatContent: 8.3,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 6.73,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/pork_chops_top_loin_boneless.webp"
};
let Brocolli: Food = {
  id: 2783,
  name: "Broccoli, raw",
  category: "Broccoli",
  servingSize: 90,
  caloriesPerServing: 35.1,
  proteinContent: 2.3,
  fatContent: 0.3,
  carbohydrateContent: 5.6,
  allergens: [],
  dietaryOptions: ["vegetarian", "vegan", "dairy-free", "high-fiber"],
  nutritionScore: 4.96,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/broccoli.webp"
};
let Goat: Food = {
  id: 685,
  name: "Goat",
  category: "Lamb, goat, game",
  servingSize: 17,
  caloriesPerServing: 24.1,
  proteinContent: 4.6,
  fatContent: 0.5,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 7.01,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/goat_meat_cooked_roasted.webp"
};

let ChickenBreast: Food = {
  id: 730,
  name: "Chicken breast, baked, broiled, or roasted, skin not eaten, from raw",
  category: "Chicken, whole pieces",
  servingSize: 135,
  caloriesPerServing: 217.4,
  proteinContent: 40.8,
  fatContent: 4.8,
  carbohydrateContent: 0,
  allergens: [],
  dietaryOptions: ["gluten-free", "keto-friendly", "high-protein"],
  nutritionScore: 7.7,
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
  id: 2126,
  name: "Rice noodles, cooked",
  category: "Pasta, noodles, cooked grains",
  servingSize: 175,
  caloriesPerServing: 187.2,
  proteinContent: 3.1,
  fatContent: 0.4,
  carbohydrateContent: 41.8,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 4.71,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/rice_noodles_cooked.webp"
};

let Anchovies: Food = {
  id: 949,
  name: "Fish, anchovy",
  category: "Fish",
  servingSize: 45,
  caloriesPerServing: 94.5,
  proteinContent: 13,
  fatContent: 4.4,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["pescatarian", "high-protein"],
  nutritionScore: 6.92,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/flat_anchovies_in_olive_oil.webp"
};

let Tilapia: Food = {
  id: 1002,
  name: "Fish, tilapia, baked or broiled",
  category: "Fish",
  servingSize: 90,
  caloriesPerServing: 144,
  proteinContent: 22.5,
  fatContent: 6,
  carbohydrateContent: 0,
  allergens: ["fish"],
  dietaryOptions: ["pescatarian", "gluten-free", "low-fat"],
  nutritionScore: 6.53,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/tilapia_fillets.webp"
};

let RiceCakes: Food = {
  id: 1986,
  name: "Rice cake",
  category: "Crackers, excludes saltines",
  servingSize: 3,
  caloriesPerServing: 11.8,
  proteinContent: 0.2,
  fatContent: 0.1,
  carbohydrateContent: 2.4,
  allergens: [],
  dietaryOptions: ["vegan", "gluten-free"],
  nutritionScore: 4.7,
  imageUrl: "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link/rice_cakes_-_lightly_salted.webp"
};

let MultigrainBread: Food = {
  id: 1712,
  name: "Bread, multigrain",
  category: "Yeast breads",
  servingSize: 36,
  caloriesPerServing: 95.4,
  proteinContent: 4.8,
  fatContent: 1.5,
  carbohydrateContent: 15.6,
  allergens: ["gluten"],
  dietaryOptions: ["vegetarian", "high-fiber"],
  nutritionScore: 6.03,
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


