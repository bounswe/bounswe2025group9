import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, WarningCircle, Plus, X } from '@phosphor-icons/react'
import { apiClient, ForumTag, CreateForumPostRequest, Food, CreateRecipeRequest, RecipeIngredient } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'
import { Tag } from '@phosphor-icons/react'
import { CUSTOM_UNITS, DEFAULT_CUSTOM_UNIT, UNIT_TO_GRAMS_CONVERSION } from './constants'

// required post types
const POST_TYPES = {
    1: "Dietary tip",
    2: "Recipe"
};

// only these tags are allowed to be selected
const ALLOWED_TAG_IDS = [1, 2];

// Define tag colors based on tag name for consistent display (copied from Forum.tsx)
const getTagStyle = (tagName: string) => {
    // Check for exact tag types from backend
    switch (tagName) {
        case "Dietary tip":
            return {
                bg: 'var(--forum-dietary-bg)',
                text: 'var(--forum-dietary-text)',
                activeBg: 'var(--forum-dietary-active-bg)',
                activeText: 'var(--forum-dietary-active-text)',
                hoverBg: 'var(--forum-dietary-hover-bg)'
            };
        case "Recipe":
            return {
                bg: 'var(--forum-recipe-bg)',
                text: 'var(--forum-recipe-text)',
                activeBg: 'var(--forum-recipe-active-bg)',
                activeText: 'var(--forum-recipe-active-text)',
                hoverBg: 'var(--forum-recipe-hover-bg)'
            };
        case "Vegan":
            return {
                bg: 'var(--forum-vegan-bg)',
                text: 'var(--forum-vegan-text)',
                activeBg: 'var(--forum-vegan-active-bg)',
                activeText: 'var(--forum-vegan-active-text)',
                hoverBg: 'var(--forum-vegan-hover-bg)'
            };
        case "Halal":
            return {
                bg: 'var(--forum-halal-bg)',
                text: 'var(--forum-halal-text)',
                activeBg: 'var(--forum-halal-active-bg)',
                activeText: 'var(--forum-halal-active-text)',
                hoverBg: 'var(--forum-halal-hover-bg)'
            };
        case "High-Protein":
            return {
                bg: 'var(--forum-high-protein-bg)',
                text: 'var(--forum-high-protein-text)',
                activeBg: 'var(--forum-high-protein-active-bg)',
                activeText: 'var(--forum-high-protein-active-text)',
                hoverBg: 'var(--forum-high-protein-hover-bg)'
            };
        // Removed "Meal plan" as it's not a post type here
        default: // Fallback for any other tag, though only "Dietary tip" and "Recipe" are used for selection
            return {
                bg: 'var(--forum-default-bg)',
                text: 'var(--forum-default-text)',
                activeBg: 'var(--forum-default-active-bg)',
                activeText: 'var(--forum-default-active-text)',
                hoverBg: 'var(--forum-default-hover-bg)'
            };
    }
};

// Hard-coded tag IDs for mapping (subset of Forum.tsx's TAG_IDS)
const TAG_IDS = {
    "Dietary tip": 1,
    "Recipe": 2,
    "Vegan": 4,
    "Halal": 5,
    "High-Protein": 6
    // "Meal plan": 3 // Not a creatable post type here
};

const CreatePost = () => {
    const navigate = useNavigate();
    const { isAuthenticated, getAccessToken, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [, setTags] = useState<ForumTag[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<number>(1); // default to dietary tip
    const [selectedDietaryTags, setSelectedDietaryTags] = useState<number[]>([]); // for dietary tags
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Recipe specific state
    const [recipeInstructions, setRecipeInstructions] = useState('');
    const [foodOptions, setFoodOptions] = useState<Food[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(false);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
    const [selectedFoodCustomAmount, setSelectedFoodCustomAmount] = useState<number>(1);
    const [selectedFoodCustomUnit, setSelectedFoodCustomUnit] = useState<string>(DEFAULT_CUSTOM_UNIT);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [foodSearchTerm, setFoodSearchTerm] = useState('');
    const unitDropdownRef = useRef<HTMLDivElement>(null);

    // Check authentication status when component mounts
    useEffect(() => {
        console.log('Auth status in CreatePost:', {
            isAuthenticated,
            accessToken: getAccessToken() ? 'Token exists' : 'No token',
            user
        });
    }, [isAuthenticated, user]);

    // Handle click outside for unit dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
                setShowUnitDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

        // Clear dietary tags when switching post type
        if (tagId !== 2) {
            setSelectedDietaryTags([]);
        }
    };

    // toggle dietary tag selection (for recipes only)
    const toggleDietaryTag = (tagId: number) => {
        if (selectedTagId !== 2) return; // only for recipes

        setSelectedDietaryTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(id => id !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
    };

    // Add ingredient to the recipe
    const addIngredient = () => {
        if (!selectedFoodId) {
            setValidationError('Please select a food item');
            return;
        }

        if (selectedFoodCustomAmount <= 0) {
            setValidationError('Please enter a valid amount');
            return;
        }

        const selectedFood = foodOptions.find(food => food.id === selectedFoodId);
        if (!selectedFood) {
            setValidationError('Selected food not found');
            return;
        }

        // Calculate amount in grams from customAmount and customUnit
        let amountInGrams: number;
        
        if (selectedFoodCustomUnit === 'serving') {
            // For 'serving' unit, use the food item's servingSize
            amountInGrams = selectedFoodCustomAmount * selectedFood.servingSize;
        } else {
            // For other units, use the standard conversion
            const conversionRate = UNIT_TO_GRAMS_CONVERSION[selectedFoodCustomUnit as keyof typeof UNIT_TO_GRAMS_CONVERSION];
            amountInGrams = selectedFoodCustomAmount * conversionRate;
        }

        // Check if ingredient already exists
        const existingIndex = ingredients.findIndex(item => item.food_id === selectedFoodId);
        if (existingIndex >= 0) {
            // Update existing ingredient
            const updatedIngredients = [...ingredients];
            updatedIngredients[existingIndex].amount += amountInGrams;
            updatedIngredients[existingIndex].customAmount += selectedFoodCustomAmount;
            setIngredients(updatedIngredients);
        } else {
            // Add new ingredient
            setIngredients([
                ...ingredients,
                {
                    food_id: selectedFoodId,
                    food_name: selectedFood.name,
                    amount: amountInGrams,
                    customAmount: selectedFoodCustomAmount,
                    customUnit: selectedFoodCustomUnit
                }
            ]);
        }

        // Reset selection
        setSelectedFoodId(null);
        setSelectedFoodCustomAmount(1);
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
            const allTagIds = [selectedTagId];
            if (selectedTagId === 2 && selectedDietaryTags.length > 0) {
                allTagIds.push(...selectedDietaryTags);
            }

            const postData: CreateForumPostRequest = {
                title,
                body: content,
                tag_ids: allTagIds
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
                            amount: item.amount,
                            customAmount: item.customAmount,
                            customUnit: item.customUnit
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
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Empty */}
                    <div className="w-full md:w-1/5"></div>

                    {/* Middle column - Post Creation Form */}
                    <div className="w-full md:w-3/5">
                        <div className="nh-card">

                            <div className="flex justify-start items-center mt-6 gap-6 mb-2">


                                <button
                                    onClick={() => navigate('/forum')}
                                    className="nh-button-square nh-button-primary flex items-center gap-2 px-2 py-2" /* Primary styling */
                                    disabled={loading}
                                >
                                    <ArrowLeft size={20} weight="bold" />
                                </button>
                                <div className="flex justify-center items-center">
                                    <h1 className="nh-title-custom">Create New Post</h1>

                                </div>

                            </div>


                            {user && (
                                <p className="mb-4 text-sm">
                                    Posting as: <span className="font-semibold">{user.username}</span>
                                </p>
                            )}

                            {/* Display success message if present */}
                            {successMessage && (
                                <div
                                    className="px-4 py-3 rounded-md mb-6 flex items-start gap-2 border"
                                    style={{
                                        backgroundColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.1)', /* fallback to green-500 rgb */
                                        borderColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.3)',
                                        color: 'var(--color-success)'
                                    }}
                                >
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Display validation error if present */}
                            {validationError && (
                                <div className="nh-error-message mb-6"> {/* Use nh-error-message class */}
                                    <WarningCircle size={20} className="flex-shrink-0 mt-0.5 mr-2" /> {/* Added margin for icon */}
                                    <span>{validationError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} id="createPostForm"> {/* Added id to form */}
                                {/* Post Title */}
                                <div className="mb-6">
                                    <label className="block mb-2 nh-subtitle text-base">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="Enter post title"
                                    />
                                </div>

                                {/* Post Type Selection - required radio button style selection */}
                                <div className="mb-6">
                                    <label className="block mb-2 nh-subtitle text-base">
                                        Post Type

                                    </label>
                                    {loading ? (
                                        <p>Loading post types...</p>
                                    ) : (
                                        <div className="flex flex-row items-start space-x-2">
                                            {Object.entries(POST_TYPES).map(([id, name]) => {
                                                const tagId = parseInt(id);
                                                const tagName = name as keyof typeof TAG_IDS; // Cast name to be a key of TAG_IDS
                                                const style = getTagStyle(tagName);
                                                const isActive = selectedTagId === tagId;

                                                return (
                                                    <button
                                                        key={tagId}
                                                        type="button" // Important: prevent form submission
                                                        onClick={() => selectTag(tagId)}
                                                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                                        style={{
                                                            backgroundColor: isActive ? style.activeBg : style.bg,
                                                            color: isActive ? style.activeText : style.text,
                                                            // Apply hover style if not active
                                                            // On hover, if not active, use hoverBg. If active, keep activeBg.
                                                        }}
                                                        onMouseOver={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.backgroundColor = style.hoverBg;
                                                            }
                                                        }}
                                                        onMouseOut={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.backgroundColor = style.bg;
                                                            }
                                                        }}
                                                    >
                                                        <Tag size={18} weight="fill" className="flex-shrink-0" />
                                                        <span className="flex-grow text-left">{name}</span>
                                                        {/* Ensure text aligns left if buttons are different widths */}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Post content */}
                                <div className="mb-6">
                                    <label className="block mb-2 nh-subtitle text-base">Content</label>
                                    <textarea
                                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                                        rows={8}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        placeholder={selectedTagId === 2
                                            ? "Describe your recipe here... Include any tips, serving suggestions, or nutritional benefits."
                                            : "Share your thoughts here..."}
                                    ></textarea>
                                </div>

                                {/* Dietary Tags - only show if Recipe is selected */}
                                {selectedTagId === 2 && (
                                    <div className="mb-6">
                                        <label className="block mb-2 nh-subtitle text-base">
                                            Dietary Tags <span className="text-sm font-normal text-gray-500">(optional)</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleDietaryTag(TAG_IDS["Vegan"])}
                                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                                style={{
                                                    backgroundColor: selectedDietaryTags.includes(TAG_IDS["Vegan"])
                                                        ? getTagStyle("Vegan").activeBg
                                                        : getTagStyle("Vegan").bg,
                                                    color: selectedDietaryTags.includes(TAG_IDS["Vegan"])
                                                        ? getTagStyle("Vegan").activeText
                                                        : getTagStyle("Vegan").text
                                                }}
                                            >
                                                <Tag size={16} weight="fill" className="flex-shrink-0" />
                                                <span>Vegan</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleDietaryTag(TAG_IDS["Halal"])}
                                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                                style={{
                                                    backgroundColor: selectedDietaryTags.includes(TAG_IDS["Halal"])
                                                        ? getTagStyle("Halal").activeBg
                                                        : getTagStyle("Halal").bg,
                                                    color: selectedDietaryTags.includes(TAG_IDS["Halal"])
                                                        ? getTagStyle("Halal").activeText
                                                        : getTagStyle("Halal").text
                                                }}
                                            >
                                                <Tag size={16} weight="fill" className="flex-shrink-0" />
                                                <span>Halal</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleDietaryTag(TAG_IDS["High-Protein"])}
                                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                                style={{
                                                    backgroundColor: selectedDietaryTags.includes(TAG_IDS["High-Protein"])
                                                        ? getTagStyle("High-Protein").activeBg
                                                        : getTagStyle("High-Protein").bg,
                                                    color: selectedDietaryTags.includes(TAG_IDS["High-Protein"])
                                                        ? getTagStyle("High-Protein").activeText
                                                        : getTagStyle("High-Protein").text
                                                }}
                                            >
                                                <Tag size={16} weight="fill" className="flex-shrink-0" />
                                                <span>High-Protein</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Recipe fields - only show if Recipe is selected */}
                                {selectedTagId === 2 && (
                                    <div className="mb-6">
                                        <div className="border rounded-md p-4 bg-[var(--color-bg-tertiary)] border-[var(--forum-search-border)]">
                                            <h3 className="nh-subtitle text-base mb-4">Recipe Details</h3>

                                            {/* Recipe Instructions */}
                                            <div className="mb-4">
                                                <label className="block mb-2 font-medium">
                                                    Cooking Instructions <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
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
                                                                className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                                                                placeholder="Search for ingredients..."
                                                                value={foodSearchTerm}
                                                                onChange={(e) => setFoodSearchTerm(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex-grow-0">
                                                            <input
                                                                type="number"
                                                                className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                                                                placeholder="Quantity"
                                                                value={selectedFoodCustomAmount}
                                                                onChange={(e) => setSelectedFoodCustomAmount(parseFloat(e.target.value))}
                                                                min={0.01}
                                                                step={0.01}
                                                            />
                                                        </div>
                                                        <div className="flex-grow-0 relative" ref={unitDropdownRef}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                                                className="w-full px-3 py-2 border rounded-lg text-left focus:ring-primary focus:border-primary nh-forum-search cursor-pointer flex items-center justify-between"
                                                            >
                                                                <span>{selectedFoodCustomUnit}</span>
                                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>

                                                            {/* Unit dropdown */}
                                                            {showUnitDropdown && (
                                                                <div
                                                                    className="absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                                                    style={{
                                                                        backgroundColor: 'var(--color-bg-primary)',
                                                                        border: '1px solid var(--color-border)'
                                                                    }}
                                                                >
                                                                    {CUSTOM_UNITS.map((unit, index) => (
                                                                        <button
                                                                            key={unit}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedFoodCustomUnit(unit);
                                                                                setShowUnitDropdown(false);
                                                                            }}
                                                                            className="w-full px-3 py-2 text-left focus:outline-none transition-colors"
                                                                            style={{
                                                                                color: 'var(--color-text-primary)',
                                                                                borderBottom: index < CUSTOM_UNITS.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                                                backgroundColor: selectedFoodCustomUnit === unit ? 'var(--color-bg-secondary)' : 'transparent'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                if (selectedFoodCustomUnit !== unit) {
                                                                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                                                                }
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                if (selectedFoodCustomUnit !== unit) {
                                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span className="text-sm font-medium capitalize">{unit}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="nh-button-square nh-button-primary"
                                                            onClick={addIngredient}
                                                            disabled={!selectedFoodId}
                                                            aria-label="Add ingredient"
                                                        >
                                                            <Plus size={20} weight="bold" className="mr-1" />

                                                        </button>
                                                    </div>

                                                    {/* Food search results */}
                                                    {foodSearchTerm.length >= 2 && (
                                                        <div className="mb-4 border border-[var(--forum-search-border)] rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                                            {loadingFoods ? (
                                                                <div className="p-4 text-center">Loading foods...</div>
                                                            ) : foodOptions.length === 0 ? (
                                                                <div className="p-4 text-center">No foods found. Try a different search term.</div>
                                                            ) : (
                                                                <div className="divide-y divide-[var(--forum-search-border)]">
                                                                    {foodOptions.map(food => (
                                                                        <div
                                                                            key={food.id}
                                                                            className={`p-3 cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center ${selectedFoodId === food.id ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
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
                                                                    className="flex justify-between items-center p-2 border border-[var(--forum-search-border)] rounded-md"
                                                                >
                                                                    <span>{ingredient.food_name} ({ingredient.customAmount} {ingredient.customUnit})</span>
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
                            </form>

                            {/* Buttons row - MOVED TO BOTTOM */}
                            <div className="flex justify-end items-center mt-6"> {/* Changed mb-6 to mt-6 */}

                                <button
                                    type="submit"
                                    form="createPostForm" // Associate with the form
                                    className="nh-button nh-button-primary  flex items-center gap-2 px-6 py-2" /* Primary styling */
                                    disabled={submitting || loading}
                                >
                                    {submitting ? 'Posting...' : 'Create Post'}
                                </button>
                            </div>
                        </div>


                    </div>

                    {/* Right column - Empty */}
                    <div className="w-full md:w-1/5"></div>
                </div>
            </div>
        </div>
    );
};

export default CreatePost; 