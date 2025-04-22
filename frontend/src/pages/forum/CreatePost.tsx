import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, CaretDown } from '@phosphor-icons/react'

// Define ingredient interface
interface Ingredient {
    id: number;
    foodId: string;
    amount: number;
}

// Define food interface
interface Food {
    id: string;
    name: string;
}

const CreatePost = () => {
    const navigate = useNavigate();
    const [postType, setPostType] = useState<'recipe' | 'nutrition_tip'>('nutrition_tip');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch available foods (in a real app, this would come from an API)
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setFoods([
                { id: 'apple', name: 'Apple' },
                { id: 'banana', name: 'Banana' },
                { id: 'chicken', name: 'Chicken Breast' },
                { id: 'rice', name: 'Brown Rice' },
                { id: 'egg', name: 'Egg' },
                { id: 'milk', name: 'Milk' },
                { id: 'broccoli', name: 'Broccoli' },
                { id: 'spinach', name: 'Spinach' },
                { id: 'almond', name: 'Almonds' },
                { id: 'salmon', name: 'Salmon' },
            ]);
            setIsLoading(false);
        }, 500);
    }, []);

    // Add a new ingredient to the list
    const addIngredient = () => {
        setIngredients([
            ...ingredients,
            {
                id: Date.now(),
                foodId: foods.length > 0 ? foods[0].id : '',
                amount: 100
            }
        ]);
    };

    // Remove an ingredient from the list
    const removeIngredient = (id: number) => {
        setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    };

    // Update an ingredient's food selection
    const updateIngredientFood = (id: number, foodId: string) => {
        setIngredients(
            ingredients.map(ingredient => 
                ingredient.id === id ? { ...ingredient, foodId } : ingredient
            )
        );
    };

    // Update an ingredient's amount
    const updateIngredientAmount = (id: number, amount: number) => {
        setIngredients(
            ingredients.map(ingredient => 
                ingredient.id === id ? { ...ingredient, amount } : ingredient
            )
        );
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prepare post data based on type
        const postData = postType === 'recipe' 
            ? {
                type: postType,
                title,
                ingredients,
                instructions
            }
            : {
                type: postType,
                title,
                content
            };
        
        // In a real implementation, we would send postData to an API
        console.log('Post created:', postData);
        
        // Navigate back to forum
        navigate('/forum');
    };

    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="mb-6">
                    <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6">
                        <ArrowLeft size={20} weight="bold" />
                        Back to Forum
                    </Link>
                </div>
                
                <div className="nh-card mb-8">
                    <h1 className="nh-title mb-6">Create New Post</h1>
                    
                    <form onSubmit={handleSubmit}>
                        {/* Post Type Selection */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">Post Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="postType"
                                        value="nutrition_tip"
                                        checked={postType === 'nutrition_tip'}
                                        onChange={() => setPostType('nutrition_tip')}
                                        className="mr-2"
                                    />
                                    Nutrition Tip
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="postType"
                                        value="recipe"
                                        checked={postType === 'recipe'}
                                        onChange={() => setPostType('recipe')}
                                        className="mr-2"
                                    />
                                    Recipe
                                </label>
                            </div>
                        </div>
                        
                        {/* Post Title - Common for both types */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                {postType === 'recipe' ? 'Recipe Name' : 'Title'}
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder={postType === 'recipe' ? 'Enter recipe name' : 'Enter post title'}
                            />
                        </div>
                        
                        {/* Recipe-specific fields */}
                        {postType === 'recipe' && (
                            <>
                                {/* Ingredients */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="nh-subtitle text-base">Ingredients</label>
                                        <button 
                                            type="button"
                                            onClick={addIngredient}
                                            className="nh-button nh-button-primary flex items-center gap-1 py-1 px-3"
                                        >
                                            <Plus size={18} weight="bold" />
                                            Add Ingredient
                                        </button>
                                    </div>
                                    
                                    {isLoading ? (
                                        <p>Loading available foods...</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {ingredients.length === 0 && (
                                                <p className="text-gray-500 italic">
                                                    No ingredients added. Click 'Add Ingredient' to add some.
                                                </p>
                                            )}
                                            
                                            {ingredients.map((ingredient) => (
                                                <div key={ingredient.id} className="flex items-center gap-3">
                                                    <div className="flex-grow">
                                                        <select
                                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                                            value={ingredient.foodId}
                                                            onChange={(e) => updateIngredientFood(ingredient.id, e.target.value)}
                                                            required
                                                        >
                                                            {foods.map((food) => (
                                                                <option key={food.id} value={food.id}>
                                                                    {food.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-32">
                                                        <div className="flex">
                                                            <input
                                                                type="number"
                                                                className="w-full p-2 border rounded-l-md dark:bg-gray-800 dark:border-gray-700"
                                                                value={ingredient.amount}
                                                                onChange={(e) => updateIngredientAmount(ingredient.id, parseInt(e.target.value) || 0)}
                                                                min="1"
                                                                required
                                                            />
                                                            <span className="bg-gray-200 dark:bg-gray-700 p-2 rounded-r-md">g</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeIngredient(ingredient.id)}
                                                        className="p-2 text-red-500 hover:text-red-700"
                                                    >
                                                        <Minus size={20} weight="bold" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Instructions */}
                                <div className="mb-6">
                                    <label className="block mb-2 nh-subtitle text-base">Instructions</label>
                                    <textarea
                                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                        rows={6}
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        required
                                        placeholder="Enter step-by-step cooking instructions"
                                    ></textarea>
                                </div>
                            </>
                        )}
                        
                        {/* Nutrition Tip content */}
                        {postType === 'nutrition_tip' && (
                            <div className="mb-6">
                                <label className="block mb-2 nh-subtitle text-base">Content</label>
                                <textarea
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                    rows={8}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    placeholder="Share your nutrition tip or advice here"
                                ></textarea>
                            </div>
                        )}
                        
                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="nh-button nh-button-primary px-6 py-2"
                            >
                                Post {postType === 'recipe' ? 'Recipe' : 'Nutrition Tip'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost; 