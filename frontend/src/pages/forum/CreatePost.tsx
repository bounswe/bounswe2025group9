import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, WarningCircle, Plus, X } from '@phosphor-icons/react'
import { apiClient, ForumTag, CreateForumPostRequest, Food, CreateRecipeRequest } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'

// required post types
const POST_TYPES = {
  1: "Dietary tip",
  2: "Recipe"
};

// only these tags are allowed to be selected
const ALLOWED_TAG_IDS = [1, 2];

const CreatePost = () => {
    const navigate = useNavigate();
    const { isAuthenticated, getAccessToken, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [, setTags] = useState<ForumTag[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<number>(1); // default to dietary tip
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Recipe specific state
    const [recipeInstructions, setRecipeInstructions] = useState('');
    const [foodOptions, setFoodOptions] = useState<Food[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(false);
    const [ingredients, setIngredients] = useState<{food_id: number; food_name: string; amount: number}[]>([]);
    const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
    const [selectedFoodAmount, setSelectedFoodAmount] = useState<number>(100);
    const [foodSearchTerm, setFoodSearchTerm] = useState('');
    
    // Check authentication status when component mounts
    useEffect(() => {
        console.log('Auth status in CreatePost:', {
            isAuthenticated,
            accessToken: getAccessToken() ? 'Token exists' : 'No token',
            user
        });
    }, [isAuthenticated, user]);
    
    // Fetch tags when component mounts
    useEffect(() => {
        fetchTags();
    }, []);
    
    // Fetch available tags from API
    const fetchTags = async () => {
        setLoading(true);
        try {
            // Log authentication status before making the API call
            console.log('Before fetching tags - Auth status:', {
                isAuthenticated,
                tokenExists: !!getAccessToken()
            });
            
            const data = await apiClient.getForumTags();
            console.log('Tags response:', data);
            
            // Check if data is an array
            if (Array.isArray(data)) {
                setTags(data);
            } else if (data && typeof data === 'object') {
                // Check if tags might be in a results property (common pagination pattern)
                const responseObj = data as { results?: ForumTag[] };
                if (Array.isArray(responseObj.results)) {
                    setTags(responseObj.results);
                } else {
                    console.error('Tags data is not in expected format:', data);
                    setTags([]);
                }
            } else {
                console.error('Unexpected tags response format:', data);
                setTags([]);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch food options when search term changes
    useEffect(() => {
        if (selectedTagId === 2 && foodSearchTerm.length >= 2) {
            fetchFoods();
        }
    }, [foodSearchTerm]);
    
    // Fetch food options
    const fetchFoods = async () => {
        setLoadingFoods(true);
        try {
            const response = await apiClient.getFoods({ search: foodSearchTerm });
            if (response && response.results) {
                setFoodOptions(response.results);
            }
        } catch (error) {
            console.error('Error fetching foods:', error);
        } finally {
            setLoadingFoods(false);
        }
    };
    
    // select tag (radio button style selection)
    const selectTag = (tagId: number) => {
        // only allow selecting from allowed tags
        if (!ALLOWED_TAG_IDS.includes(tagId)) {
            return;
        }
        
        setSelectedTagId(tagId);
        setValidationError('');
    };
    
    // Add ingredient to the recipe
    const addIngredient = () => {
        if (!selectedFoodId) {
            setValidationError('Please select a food item');
            return;
        }
        
        const selectedFood = foodOptions.find(food => food.id === selectedFoodId);
        if (!selectedFood) {
            setValidationError('Selected food not found');
            return;
        }
        
        // Check if ingredient already exists
        const existingIndex = ingredients.findIndex(item => item.food_id === selectedFoodId);
        if (existingIndex >= 0) {
            // Update existing ingredient
            const updatedIngredients = [...ingredients];
            updatedIngredients[existingIndex].amount += selectedFoodAmount;
            setIngredients(updatedIngredients);
        } else {
            // Add new ingredient
            setIngredients([
                ...ingredients,
                {
                    food_id: selectedFoodId,
                    food_name: selectedFood.name,
                    amount: selectedFoodAmount
                }
            ]);
        }
        
        // Reset selection
        setSelectedFoodId(null);
        setSelectedFoodAmount(100);
        setFoodSearchTerm('');
        setValidationError('');
    };
    
    // Remove ingredient from the recipe
    const removeIngredient = (index: number) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        setIngredients(updatedIngredients);
    };
    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated || !getAccessToken()) {
            console.error('User is not authenticated. Cannot submit post.');
            alert('You must be logged in to create a post. Please log in and try again.');
            navigate('/login');
            return;
        }
        
        if (title.trim() === '' || content.trim() === '') {
            setValidationError('Please fill in all required fields');
            return;
        }
        
        // Validate recipe fields if recipe is selected
        if (selectedTagId === 2) {
            if (recipeInstructions.trim() === '') {
                setValidationError('Please provide cooking instructions for the recipe');
                return;
            }
            
            if (ingredients.length === 0) {
                setValidationError('Please add at least one ingredient to the recipe');
                return;
            }
        }
        
        setSubmitting(true);
        setValidationError('');
        
        try {
            // Log authentication status before submission
            console.log('Before post submission - Auth status:', {
                isAuthenticated,
                tokenExists: !!getAccessToken(),
                tokenFirstChars: getAccessToken()?.substring(0, 10)
            });
            
            // Create post data according to the API spec
            const postData: CreateForumPostRequest = {
                title,
                body: content,
                tag_ids: [selectedTagId] // include only the selected tag
            };
            
            console.log('Submitting post with data:', postData);
            
            // Use the apiClient to create the post
            const response = await apiClient.createForumPost(postData);
            console.log('Post created:', response);
            
            // If it's a recipe post, create the recipe
            if (selectedTagId === 2) {
                try {
                    // Prepare recipe data
                    const recipeData: CreateRecipeRequest = {
                        post_id: response.id,
                        instructions: recipeInstructions,
                        ingredients: ingredients.map(item => ({
                            food_id: item.food_id,
                            amount: item.amount
                        }))
                    };
                    
                    console.log('Creating recipe with data:', recipeData);
                    
                    // Create the recipe
                    const recipeResponse = await apiClient.createRecipe(recipeData);
                    console.log('Recipe created:', recipeResponse);
                } catch (recipeError) {
                    console.error('Error creating recipe:', recipeError);
                    // Continue with the post creation flow even if recipe creation fails
                }
            }
            
            // Show success message
            setSuccessMessage('Post created successfully! Redirecting to forum...');
            
            // Force refresh forum posts by navigating with a state parameter
            setTimeout(() => {
                navigate('/forum', { state: { refreshPosts: true } });
            }, 2000);
        } catch (error) {
            console.error('Error creating post:', error);
            setValidationError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // If not authenticated, show login message
    if (!isAuthenticated) {
        return (
            <div className="py-12">
                <div className="nh-container">
                    <div className="nh-card mb-8">
                        <h1 className="nh-title mb-6">Authentication Required</h1>
                        <p className="mb-4">You need to be logged in to create a post.</p>
                        <div className="flex gap-4">
                            <Link to="/login" className="nh-button nh-button-primary">
                                Log In
                            </Link>
                            <Link to="/forum" className="nh-button nh-button-outline">
                                Back to Forum
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    
                    {user && (
                        <p className="mb-4 text-sm">
                            Posting as: <span className="font-semibold">{user.username}</span>
                        </p>
                    )}
                    
                    {/* Display success message if present */}
                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-md mb-6 flex items-start gap-2">
                            <span>{successMessage}</span>
                        </div>
                    )}
                    
                    {/* Display validation error if present */}
                    {validationError && (
                        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6 flex items-start gap-2">
                            <WarningCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{validationError}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        {/* Post Title */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                Title
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Enter post title"
                            />
                        </div>
                        
                        {/* Post Type Selection - required radio button style selection */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                Post Type <span className="text-red-500">*</span>
                                <span className="text-sm font-normal ml-2 text-gray-500">
                                    (Required - select one)
                                </span>
                            </label>
                            {loading ? (
                                <p>Loading post types...</p>
                            ) : (
                                <div className="flex flex-col space-y-2">
                                    {Object.entries(POST_TYPES).map(([id, name]) => {
                                        const tagId = parseInt(id);
                                        return (
                                            <label key={tagId} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="postType"
                                                    checked={selectedTagId === tagId}
                                                    onChange={() => selectTag(tagId)}
                                                    className="form-radio text-primary h-5 w-5"
                                                />
                                                <span className="text-base">{name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        {/* Post content */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">Content</label>
                            <textarea
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                placeholder={selectedTagId === 2 
                                    ? "Describe your recipe here... Include any tips, serving suggestions, or nutritional benefits."
                                    : "Share your thoughts here..."}
                            ></textarea>
                        </div>
                        
                        {/* Recipe fields - only show if Recipe is selected */}
                        {selectedTagId === 2 && (
                            <div className="mb-6">
                                <div className="border dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="nh-subtitle text-base mb-4">Recipe Details</h3>
                                    
                                    {/* Recipe Instructions */}
                                    <div className="mb-4">
                                        <label className="block mb-2 font-medium">
                                            Cooking Instructions <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                            rows={6}
                                            value={recipeInstructions}
                                            onChange={(e) => setRecipeInstructions(e.target.value)}
                                            placeholder="1. Preheat oven to 350°F.&#10;2. Mix the ingredients...&#10;3. Cook for 25 minutes.&#10;..."
                                        ></textarea>
                                    </div>
                                    
                                    {/* Ingredients Selection */}
                                    <div className="mb-4">
                                        <label className="block mb-2 font-medium">
                                            Ingredients <span className="text-red-500">*</span>
                                        </label>
                                        
                                        {/* Food search */}
                                        <div className="mb-4">
                                            <div className="flex flex-col md:flex-row gap-2 mb-2">
                                                <div className="flex-grow">
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                                        placeholder="Search for ingredients..."
                                                        value={foodSearchTerm}
                                                        onChange={(e) => setFoodSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-grow-0">
                                                    <input
                                                        type="number"
                                                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                                        placeholder="Amount (g)"
                                                        value={selectedFoodAmount}
                                                        onChange={(e) => setSelectedFoodAmount(parseInt(e.target.value))}
                                                        min={1}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="nh-button nh-button-primary"
                                                    onClick={addIngredient}
                                                    disabled={!selectedFoodId}
                                                >
                                                    <Plus size={20} weight="bold" className="mr-1" />
                                                    Add
                                                </button>
                                            </div>
                                            
                                            {/* Food search results */}
                                            {foodSearchTerm.length >= 2 && (
                                                <div className="mb-4 border dark:border-gray-700 rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                                    {loadingFoods ? (
                                                        <div className="p-4 text-center">Loading foods...</div>
                                                    ) : foodOptions.length === 0 ? (
                                                        <div className="p-4 text-center">No foods found. Try a different search term.</div>
                                                    ) : (
                                                        <div className="divide-y dark:divide-gray-700">
                                                            {foodOptions.map(food => (
                                                                <div 
                                                                    key={food.id}
                                                                    className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center ${selectedFoodId === food.id ? 'bg-primary bg-opacity-10' : ''}`}
                                                                    onClick={() => setSelectedFoodId(food.id)}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        className="mr-2"
                                                                        checked={selectedFoodId === food.id}
                                                                        onChange={() => setSelectedFoodId(food.id)}
                                                                    />
                                                                    <div>
                                                                        <div className="font-medium">{food.name}</div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {food.category} • 
                                                                            {food.proteinContent}g protein • 
                                                                            {food.fatContent}g fat • 
                                                                            {food.carbohydrateContent}g carbs • 
                                                                            {food.caloriesPerServing} calories
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Ingredient List */}
                                        <div className="mb-2">
                                            <h4 className="font-medium mb-2">Selected Ingredients:</h4>
                                            {ingredients.length === 0 ? (
                                                <p className="text-gray-500 italic">No ingredients added yet.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {ingredients.map((ingredient, index) => (
                                                        <li 
                                                            key={index}
                                                            className="flex justify-between items-center p-2 border dark:border-gray-700 rounded-md"
                                                        >
                                                            <span>{ingredient.food_name} ({ingredient.amount}g)</span>
                                                            <button
                                                                type="button"
                                                                className="text-red-500 hover:text-red-700 p-1"
                                                                onClick={() => removeIngredient(index)}
                                                            >
                                                                <X size={18} weight="bold" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="nh-button nh-button-primary px-6 py-2"
                                disabled={submitting || loading}
                            >
                                {submitting ? 'Posting...' : 'Create Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost; 