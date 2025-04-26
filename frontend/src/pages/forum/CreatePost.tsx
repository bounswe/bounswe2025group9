import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, MagnifyingGlass, X } from '@phosphor-icons/react'
import { apiClient, Food, CreatePostRequest, PostIngredient } from '../../lib/apiClient'

// Local interfaces for this component
interface FoodItem {
    id: number;
    name: string;
}

// Post interfaces
interface PostBase {
    type: 'recipe' | 'nutrition_tip';
    title: string;
}

interface RecipePost extends PostBase {
    type: 'recipe';
    ingredients: PostIngredient[];
    instructions: string;
}

interface NutritionTipPost extends PostBase {
    type: 'nutrition_tip';
    content: string;
}

type PostData = RecipePost | NutritionTipPost;

const CreatePost = () => {
    const navigate = useNavigate();
    const [postType, setPostType] = useState<'recipe' | 'nutrition_tip'>('nutrition_tip');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<PostIngredient[]>([]);
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // States for ingredient search functionality
    const [activeIngredientId, setActiveIngredientId] = useState<number | null>(null);
    const [searchTerms, setSearchTerms] = useState<{[key: number]: string}>({});
    const [showDropdown, setShowDropdown] = useState<{[key: number]: boolean}>({});
    const dropdownRef = useRef<{[key: number]: HTMLDivElement | null}>({});

    // Set ref for dropdown elements
    const setDropdownRef = (id: number, element: HTMLDivElement | null) => {
        dropdownRef.current[id] = element;
    };

    // Fetch foods when component mounts
    useEffect(() => {
        fetchFoods();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeIngredientId && 
                dropdownRef.current[activeIngredientId] && 
                !dropdownRef.current[activeIngredientId]?.contains(event.target as Node)) {
                setShowDropdown(prev => ({...prev, [activeIngredientId]: false}));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeIngredientId]);

    // Fetch foods from API
    const fetchFoods = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getFoods();
            
            // Transform foods into simpler format for our select dropdowns
            const foodItems: FoodItem[] = data.map(food => ({
                id: food.id,
                name: food.name
            }));
            
            setFoods(foodItems);
            
            // No longer initializing a default ingredient here
        } catch (error) {
            console.error('Error fetching foods:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add a new ingredient to the list
    const addIngredient = () => {
        if (foods.length === 0) return;
        
        const newIngredientId = Date.now();
        
        setIngredients([
            ...ingredients,
            {
                id: newIngredientId,
                foodId: 0, // Using 0 as a temporary ID
                foodName: '', // Empty food name
                amount: 100
            }
        ]);
        
        // Initialize empty search term for the new ingredient
        setSearchTerms(prev => ({
            ...prev,
            [newIngredientId]: ''
        }));
        
        // Show dropdown immediately for this new ingredient
        setShowDropdown(prev => ({
            ...prev,
            [newIngredientId]: true
        }));
        
        // Set this as the active ingredient
        setActiveIngredientId(newIngredientId);
    };

    // Remove an ingredient from the list
    const removeIngredient = (id: number) => {
        setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
        
        // Clean up search state
        const newSearchTerms = {...searchTerms};
        delete newSearchTerms[id];
        setSearchTerms(newSearchTerms);
        
        const newShowDropdown = {...showDropdown};
        delete newShowDropdown[id];
        setShowDropdown(newShowDropdown);
    };

    // Update an ingredient's food selection
    const updateIngredientFood = (id: number, foodId: number, foodName: string) => {
        setIngredients(
            ingredients.map(ingredient => 
                ingredient.id === id 
                ? { 
                    ...ingredient, 
                    foodId, 
                    foodName
                } 
                : ingredient
            )
        );
        
        // Update search term with the selected food name
        setSearchTerms(prev => ({...prev, [id]: foodName}));
        
        // Close dropdown after selection
        setShowDropdown(prev => ({...prev, [id]: false}));
        
        // Clear active ingredient
        setActiveIngredientId(null);
    };

    // Update an ingredient's amount
    const updateIngredientAmount = (id: number, amount: number) => {
        setIngredients(
            ingredients.map(ingredient => 
                ingredient.id === id ? { ...ingredient, amount } : ingredient
            )
        );
    };

    // Handle search input change
    const handleSearchChange = (id: number, term: string) => {
        setSearchTerms(prev => ({...prev, [id]: term}));
        setShowDropdown(prev => ({...prev, [id]: true}));
        setActiveIngredientId(id);
    };

    // Filter foods based on search term
    const getFilteredFoods = (id: number) => {
        const searchTerm = searchTerms[id] || '';
        if (!searchTerm.trim()) return foods;
        
        // Perform case-insensitive search
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        // Only return foods that start with the search term
        return foods.filter(food => 
            food.name.toLowerCase().startsWith(lowerSearchTerm)
        );
    };

    // Clear search input
    const clearSearch = (id: number) => {
        // Get current ingredient
        const ingredient = ingredients.find(ing => ing.id === id);
        if (!ingredient) return;
        
        // Reset search to current food name
        setSearchTerms(prev => ({...prev, [id]: ingredient.foodName}));
    };

    // Create post request data
    const createPostRequestData = (): CreatePostRequest => {
        if (postType === 'recipe') {
            // Validate that we have ingredients
            if (ingredients.length === 0) {
                throw new Error('Recipe must have at least one ingredient');
            }
            
            // Check if any ingredients have invalid/empty food selections
            const hasInvalidIngredients = ingredients.some(ing => ing.foodId === 0 || ing.foodName === '');
            if (hasInvalidIngredients) {
                throw new Error('All ingredients must have a food selected');
            }
            
            return {
                type: 'recipe',
                title,
                ingredients,
                instructions
            };
        } else {
            return {
                type: 'nutrition_tip',
                title,
                content
            };
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if we're trying to post a recipe without ingredients
        if (postType === 'recipe' && ingredients.length === 0) {
            alert('Please add at least one ingredient to your recipe');
            return;
        }
        
        // Check if any ingredients have empty food selections
        if (postType === 'recipe') {
            const emptyIngredients = ingredients.filter(ing => ing.foodId === 0 || ing.foodName === '');
            if (emptyIngredients.length > 0) {
                alert('Please select a food for all ingredients');
                return;
            }
        }
        
        setSubmitting(true);
        
        try {
            // Create post data
            const postData = createPostRequestData();
            
            // Use the apiClient to create the post
            const response = await apiClient.createPost(postData);
            console.log('Post created:', response);
            
            // Navigate back to forum
            navigate('/forum');
        } catch (error) {
            console.error('Error creating post:', error);
            // In a real app, we would show an error message to the user
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
                                            disabled={loading}
                                        >
                                            <Plus size={18} weight="bold" />
                                            Add Ingredient
                                        </button>
                                    </div>
                                    
                                    {loading ? (
                                        <p>Loading available foods...</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {ingredients.length === 0 ? (
                                                <div className="text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                                                    <p className="text-gray-500 mb-3">
                                                        No ingredients added yet. Please add ingredients to your recipe.
                                                    </p>
                                                    <button 
                                                        type="button"
                                                        onClick={addIngredient}
                                                        className="nh-button nh-button-primary flex items-center gap-1 py-2 px-4 mx-auto"
                                                        disabled={loading}
                                                    >
                                                        <Plus size={20} weight="bold" />
                                                        Add Your First Ingredient
                                                    </button>
                                                </div>
                                            ) : (
                                                ingredients.map((ingredient) => (
                                                    <div key={ingredient.id} className="flex items-center gap-3">
                                                        <div className="flex-grow relative" ref={(el) => setDropdownRef(ingredient.id, el)}>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 pr-14"
                                                                    value={searchTerms[ingredient.id] || ''}
                                                                    onChange={(e) => handleSearchChange(ingredient.id, e.target.value)}
                                                                    onFocus={() => {
                                                                        setShowDropdown(prev => ({...prev, [ingredient.id]: true}));
                                                                        setActiveIngredientId(ingredient.id);
                                                                    }}
                                                                    placeholder="Search for an ingredient..."
                                                                    required
                                                                />
                                                                <div className="absolute inset-y-0 right-0 flex items-center">
                                                                    {searchTerms[ingredient.id] && (
                                                                        <button
                                                                            type="button"
                                                                            className="px-2 flex items-center text-gray-400 hover:text-gray-600"
                                                                            onClick={() => clearSearch(ingredient.id)}
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    )}
                                                                    <div className="px-3 flex items-center pointer-events-none">
                                                                        <MagnifyingGlass size={16} className="text-gray-400" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Search Results Dropdown */}
                                                            {showDropdown[ingredient.id] && (
                                                                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                                                                    {getFilteredFoods(ingredient.id).length > 0 ? (
                                                                        getFilteredFoods(ingredient.id).map(food => (
                                                                            <div 
                                                                                key={food.id}
                                                                                className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                                                    ingredient.foodId === food.id ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : ''
                                                                                }`}
                                                                                onClick={() => updateIngredientFood(ingredient.id, food.id, food.name)}
                                                                            >
                                                                                {food.name}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-2 text-gray-500">No matching foods found</div>
                                                                    )}
                                                                </div>
                                                            )}
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
                                                            disabled={ingredients.length <= 1}
                                                        >
                                                            <Minus size={20} weight="bold" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
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
                                disabled={submitting}
                            >
                                {submitting ? 'Posting...' : `Post ${postType === 'recipe' ? 'Recipe' : 'Nutrition Tip'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost; 