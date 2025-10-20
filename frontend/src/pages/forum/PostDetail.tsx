import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { User, ThumbsUp, ArrowLeft, Tag, ChatDots, CaretLeft, CaretRight, CookingPot, Scales, Fire } from '@phosphor-icons/react'
import { apiClient, Recipe } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'
import ProfileImage from '../../components/ProfileImage'
// import shared cache functions
import { getPostFromCache, setPostInCache, updatePostLikeStatusInCache } from '../../lib/postCache';

// local storage key for liked posts - reuse same key
const LIKED_POSTS_STORAGE_KEY = 'nutriHub_likedPosts';


// Use ForumPost from apiClient directly
import { ForumPost } from '../../lib/apiClient';

// Comment type definition
interface Comment {
    id: number;
    post: number;
    author: {
        id: number;
        username: string;
        profile_image?: string | null;
    };
    body: string;
    created_at: string;
    updated_at?: string;
}

// Define tag colors based on tag name for consistent display
const getTagStyle = (tagName: string) => {
    // Check for exact tag types from backend
    switch (tagName) {
        case "Dietary tip":
            return { 
                bg: 'var(--forum-dietary-bg)',
                text: 'var(--forum-dietary-text)'
            };
        case "Recipe":
            return { 
                bg: 'var(--forum-recipe-bg)',
                text: 'var(--forum-recipe-text)'
            };
        case "Meal plan":
            return { 
                bg: 'var(--forum-mealplan-bg)',
                text: 'var(--forum-mealplan-text)'
            };
        case "Vegan":
            return { 
                bg: 'var(--forum-vegan-bg)',
                text: 'var(--forum-vegan-text)'
            };
        case "Halal":
            return { 
                bg: 'var(--forum-halal-bg)',
                text: 'var(--forum-halal-text)'
            };
        case "High-Protein":
            return { 
                bg: 'var(--forum-high-protein-bg)',
                text: 'var(--forum-high-protein-text)'
            };
        default:
            return { 
                bg: 'var(--forum-default-bg)',
                text: 'var(--forum-default-text)'
            };
    }
};

const PostDetail = () => {
    const { postId } = useParams<{ postId: string }>()
    const postIdNum = parseInt(postId || '0')
    const navigate = useNavigate()
    const { user } = useAuth();
    const username = user?.username || 'anonymous';
    
    // Post state - use ForumPost type
    const [post, setPost] = useState<ForumPost | null>(null)
    const [loading, setLoading] = useState(true)
    
    // Recipe state
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [loadingRecipe, setLoadingRecipe] = useState(false)
    
    // Comment state
    const [commentText, setCommentText] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentPage, setCommentPage] = useState(1)
    const [totalComments, setTotalComments] = useState(0)
    const commentsPerPage = 10 // Default comments per page

    // Calculate total pages for comments
    const totalCommentPages = Math.ceil(totalComments / commentsPerPage)

    // Helper function to update local storage (keep for consistency)
    const updateLikedPostsStorage = (postId: number, isLiked: boolean) => {
        try {
            const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let allUsersLikedPosts: {[username: string]: {[postId: number]: boolean}} = {};
            
            if (storedLikedPosts) {
                allUsersLikedPosts = JSON.parse(storedLikedPosts);
            }
            
            // Get current user's liked posts or create empty object
            const userLikedPosts = allUsersLikedPosts[username] || {};
            
            // Update the liked status for this post
            const updatedUserLikedPosts = {
                ...userLikedPosts,
                [postId]: isLiked
            };
            
            // Update the entire structure with the user's data
            const updatedAllUsersLikedPosts = {
                ...allUsersLikedPosts,
                [username]: updatedUserLikedPosts
            };
            
            // Save to local storage
            localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(updatedAllUsersLikedPosts));
        } catch (error) {
            console.error('Error saving liked posts to localStorage:', error);
        }
    };

    // Fetch specific post when component mounts
    useEffect(() => {
        fetchPost();
    }, [postId]);
    
    // Fetch comments when we have a valid post or when page changes
    useEffect(() => {
        if (post) {
            fetchComments();
            // Check if post has a recipe
            if (post.has_recipe) {
                fetchRecipe();
            }
        }
    }, [post, commentPage]);
    
    // Fetch comments for the current post
    const fetchComments = async () => {
        if (!postId || isNaN(postIdNum)) return;
        
        setLoadingComments(true);
        try {
            const response = await apiClient.getPostComments(postIdNum, {
                page: commentPage,
                page_size: commentsPerPage
            });
            
            if (response) {
                // Update total comments count
                setTotalComments(response.count);
                
                // Transform API comments to match our interface if needed
                const transformedComments = response.results.map(comment => ({
                    id: comment.id,
                    post: comment.post,
                    author: comment.author,
                    body: comment.body,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at
                }));
                setComments(transformedComments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    // Fetch recipe for the post
    const fetchRecipe = async () => {
        if (!postId || isNaN(postIdNum)) return;
        
        setLoadingRecipe(true);
        try {
            const recipeData = await apiClient.getRecipeForPost(postIdNum);
            console.log('[PostDetail] Received recipe data:', recipeData);
            setRecipe(recipeData);
        } catch (error) {
            console.error('Error fetching recipe:', error);
        } finally {
            setLoadingRecipe(false);
        }
    };

    // Handle comment page change
    const handleCommentPageChange = (page: number) => {
        setCommentPage(page);
        // Scroll to comments section
        document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch post data from API
    const fetchPost = async () => {
        if (!postId || isNaN(postIdNum)) {
            console.log('[PostDetail] Invalid post ID, redirecting to forum');
            navigate('/forum');
            return;
        }

        // 1. Try fetching from cache first
        const cachedPost = getPostFromCache(postIdNum, username);
        if (cachedPost) {
            console.log(`[PostDetail] Cache hit for post ID: ${postIdNum}`);
            setPost(cachedPost);
            setLoading(false);
            return; // exit if cache hit is successful
        }

        console.log(`[PostDetail] Fetching post with ID: ${postIdNum}`);
        setLoading(true);
        try {
            // Get post details using the new endpoint
            const postData = await apiClient.getPostDetail(postIdNum);
            
            if (postData) {
                console.log('[PostDetail] Received post data from API:', postData);

                // Ensure the fetched post data conforms to ForumPost structure
                const fetchedPost: ForumPost = {
                    ...postData,
                    // Ensure likes field exists, map from like_count if necessary (apiClient might already handle this)
                    likes: (postData as any).like_count ?? postData.likes ?? 0,
                    // author is now an object with id and username from the backend
                    author: postData.author,
                };

                console.log('[PostDetail] Using ForumPost data structure:', fetchedPost);

                // Check local storage for liked status (redundant if cache handles this, but safe fallback)
                const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
                if (storedLikedPosts) {
                    try {
                        const parsedData = JSON.parse(storedLikedPosts);
                        const userLikedPosts = parsedData[username] || {};
                        // If we have this post in local storage, use that value
                        if (userLikedPosts[postIdNum] !== undefined) {
                            const localLiked = userLikedPosts[postIdNum];
                            fetchedPost.liked = localLiked;
                        } else {
                            // No local storage entry for this post, create one based on API data
                            updateLikedPostsStorage(postIdNum, fetchedPost.liked || false);
                        }
                    } catch (error) {
                        console.error('Error parsing liked posts from localStorage:', error);
                        // Fallback: use API data and update storage
                        updateLikedPostsStorage(postIdNum, fetchedPost.liked || false);
                    }
                } else {
                    // No local storage data, use API response and initialize storage
                    updateLikedPostsStorage(postIdNum, fetchedPost.liked || false);
                }
                
                // Set the post state
                setPost(fetchedPost);
                // Add/update the post in the shared cache
                setPostInCache(fetchedPost, username);
            } else {
                console.log('[PostDetail] Post not found, redirecting to forum');
                // Post not found, redirect to forum
                navigate('/forum');
            }
        } catch (error) {
            console.error('[PostDetail] Error fetching post:', error);
            // On error, redirect to forum
            navigate('/forum');
        } finally {
            setLoading(false);
            console.log('[PostDetail] Finished loading post');
        }
    };
    
    // Handle like button click
    const handleLikeToggle = async () => {
        if (!post) return;
        
        try {
            console.log(`[PostDetail] Toggling like for post ID: ${post.id}. Current liked: ${post.liked}`);
            
            // Optimistic update for better UX
            const newLikedState = !post.liked;
            const currentLikeCount = Math.max(0, post.likes || 0); // Ensure non-negative
            const newLikeCount = Math.max(0, currentLikeCount + (newLikedState ? 1 : -1)); // Ensure non-negative
            
            // Update local storage first
            updateLikedPostsStorage(post.id, newLikedState);
            
            // Update state immediately for responsive UI
            setPost({
                ...post,
                liked: newLikedState,
                likes: newLikeCount
            });
            
            // Update the shared cache
            updatePostLikeStatusInCache(post.id, newLikedState, newLikeCount, username);
            
            // Call API to toggle like status
            const response = await apiClient.toggleLikePost(post.id);
            console.log(`[PostDetail] Toggle like response:`, response);

            // If the server response doesn't match our optimistic update, correct it
            const responseObj = response as any;
            const serverLiked = responseObj.liked;
            const serverLikeCount = responseObj.like_count;

            let finalLiked = newLikedState;
            let finalLikeCount = newLikeCount;

            if (serverLiked !== undefined && serverLiked !== newLikedState) {
                console.warn(`[PostDetail] Server liked state (${serverLiked}) differs from local state (${newLikedState})`);
                finalLiked = serverLiked;
                // Re-update local storage if server differs
                updateLikedPostsStorage(post.id, finalLiked);
            }
            
            if (serverLikeCount !== undefined && serverLikeCount !== newLikeCount) {
                console.warn(`[PostDetail] Server like count (${serverLikeCount}) differs from optimistic count (${newLikeCount})`);
                finalLikeCount = serverLikeCount;
            }
            
            // Correct the state and cache if there was a mismatch
            if (finalLiked !== newLikedState || finalLikeCount !== newLikeCount) {
                setPost(prevPost => prevPost ? { ...prevPost, liked: finalLiked, likes: finalLikeCount } : null);
                updatePostLikeStatusInCache(post.id, finalLiked, finalLikeCount, username);
            }
            
        } catch (error) {
            console.error('[PostDetail] Error toggling post like:', error);
            // On error, revert to previous state
            if (post) {
                // Determine the state before the failed toggle
                const revertedLikedState = !post.liked;
                const likeDelta = revertedLikedState ? 1 : -1; // If it was true before fail, delta is +1
                const revertLikeCount = post.likes - likeDelta; // Revert the optimistic count change
                
                setPost({
                    ...post,
                    liked: revertedLikedState,
                    likes: revertLikeCount
                });
                
                // Revert local storage too
                updateLikedPostsStorage(post.id, revertedLikedState);
                // Revert cache
                updatePostLikeStatusInCache(post.id, revertedLikedState, revertLikeCount, username);
            }
        }
    };
    
    // Handle comment submission
    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (commentText.trim() === '' || !post) return
        
        try {
            // Call API to create comment
            const newComment = await apiClient.createComment({
                post: post.id,
                body: commentText
            });
            
            // Transform the new comment to match our interface if needed
            const transformedComment = {
                id: newComment.id,
                post: newComment.post,
                author: newComment.author,
                body: newComment.body,
                created_at: newComment.created_at,
                updated_at: newComment.updated_at
            };
            
            // Add the new comment to the list and clear the form
            setComments([transformedComment, ...comments]);
            setCommentText('');
            
            // Increment total comments count
            setTotalComments(prev => prev + 1);
            
            // If not on the first page, go to first page to see the new comment
            if (commentPage !== 1) {
                setCommentPage(1);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Failed to post comment. Please try again.');
        }
    };
    
    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // Render recipe section
    const renderRecipe = () => {
        if (!recipe) return null;
        
        return (
            <div className="nh-card mb-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center mr-3">
                        <CookingPot size={24} weight="fill" className="text-primary" />
                    </div>
                    <h2 className="nh-subtitle">Recipe Details</h2>
                </div>
                
                {/* Nutritional Information */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg text-center bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                        <div className="flex justify-center mb-1">
                            <Fire size={20} weight="fill" className="text-red-500" />
                        </div>
                        <div className="text-lg font-bold">{Math.round(recipe.total_calories)} kcal</div>
                        <div className="text-xs text-gray-500">Calories</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                        <div className="flex justify-center mb-1">
                            <Scales size={20} weight="fill" className="text-blue-500" />
                        </div>
                        <div className="text-lg font-bold">{Math.round(recipe.total_protein)}g</div>
                        <div className="text-xs text-gray-500">Protein</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                        <div className="flex justify-center mb-1">
                            <Scales size={20} weight="fill" className="text-yellow-500" />
                        </div>
                        <div className="text-lg font-bold">{Math.round(recipe.total_fat)}g</div>
                        <div className="text-xs text-gray-500">Fat</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                        <div className="flex justify-center mb-1">
                            <Scales size={20} weight="fill" className="text-green-500" />
                        </div>
                        <div className="text-lg font-bold">{Math.round(recipe.total_carbohydrates)}g</div>
                        <div className="text-xs text-gray-500">Carbs</div>
                    </div>
                </div>
                
                {/* Ingredients */}
                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        {recipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="nh-ingredient-main-text">
                                <span className="font-medium">{ingredient.food_name}</span> - {ingredient.amount}g
                                <span className="nh-ingredient-nutrient-text">
                                    ({ingredient.protein?.toFixed(1)}g protein, {ingredient.fat?.toFixed(1)}g fat, {ingredient.carbs?.toFixed(1)}g carbs)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Cooking Instructions */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                    <div className="whitespace-pre-line p-4 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                        {recipe.instructions}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="nh-container">
                    <div className="mb-6">
                        <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6 py-3 rounded-lg shadow-sm hover:shadow transition-all px-4">
                            <ArrowLeft size={20} weight="bold" />
                            Back to Forum
                        </Link>
                    </div>
                    <div className="text-center my-12">
                        <p className="text-lg">Loading post...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="w-full py-12">
                <div className="nh-container">
                    <div className="mb-6">
                        <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6 py-3 rounded-lg shadow-sm hover:shadow transition-all px-4">
                            <ArrowLeft size={20} weight="bold" />
                            Back to Forum
                        </Link>
                    </div>
                    <div className="text-center my-12">
                        <p className="text-lg">Post not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                {/* Apply three-column layout */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Empty */}
                    <div className="w-full md:w-1/5"></div>

                    {/* Middle column - Post Details */}
                    <div className="w-full md:w-3/5">
                        
                        {/* Post Card - nh-card for the post content itself */}
                        <div className="nh-card mb-8 rounded-lg shadow-md">
                            {/* Combined Back button and Title container INSIDE the card */}
                            <div className="flex items-center gap-4 mb-4 pt-4 px-4"> {/* Added padding here if needed */}
                                <Link 
                                    to="/forum" 
                                    className="nh-button-square nh-button-primary flex items-center justify-center p-2"
                                >
                                    <ArrowLeft size={20} weight="bold" />
                                </Link>
                              
                                <h1 className="nh-title-custom flex-grow">{post.title}</h1>
                            </div>
                            
                            {/* Tags - Ensure styling is relative to the card padding */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4 px-4"> {/* Added padding here if needed */}
                                    {post.tags.map((tag) => {
                                        const tagStyle = getTagStyle(tag.name);
                                        return (
                                            <div 
                                                key={tag.id} 
                                                className="flex items-center px-3 py-1.5 rounded-md text-sm font-medium" 
                                                style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}
                                            >
                                                <Tag size={14} weight="fill" className="mr-1.5" />
                                                {tag.name}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            <p className="nh-text mb-6 px-4"> {/* Added padding here if needed */}
                                {post.body}
                            </p>
                            
                            {/* Footer of the card with author and likes - Ensure styling is relative to the card padding */}
                            <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4 pb-4 px-4"> {/* Added padding here */}
                                <span className="flex items-center gap-2">
                                    <ProfileImage 
                                        profileImage={post.author.profile_image}
                                        username={post.author.username}
                                        size="sm"
                                    />
                                    <div className="flex items-center gap-1">
                                        <User size={16} className="flex-shrink-0" />
                                        Posted by: {post.author.username} • {formatDate(post.created_at)}
                                    </div>
                                </span>
                                <button 
                                    onClick={handleLikeToggle}
                                    className={`flex items-center gap-1 transition-colors duration-200 rounded-md px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 ${post.liked ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    <div className="flex items-center justify-center">
                                        <ThumbsUp size={16} weight={post.liked ? "fill" : "regular"} className="flex-shrink-0" />
                                    </div>
                                    Likes: {post.likes}
                                </button>
                            </div>
                        </div>
                        
                        {/* Recipe Section - Show if post has recipe and recipe is loaded */}
                        {post.has_recipe && (
                            loadingRecipe ? (
                                <div className="mb-8 text-center py-4">
                                    <p>Loading recipe details...</p>
                                </div>
                            ) : recipe ? (
                                renderRecipe()
                            ) : (
                                <div className="mb-8 text-center py-4">
                                    <p>Recipe information could not be loaded.</p>
                                </div>
                            )
                        )}
                        
                        {/* Comments Section */}
                        <div className="mb-6">
                            <h2 className="nh-subtitle mb-4 flex items-center gap-2">
                                <ChatDots size={20} weight="fill" className="text-primary" />
                                Comments ({comments.length})
                            </h2>
                            
                            {loadingComments ? (
                                <div className="text-center py-4">
                                    <p>Loading comments...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-4">
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-8">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="nh-card rounded-lg shadow-sm border border-gray-700">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mr-3">
                                                    <ProfileImage 
                                                        profileImage={comment.author.profile_image}
                                                        username={comment.author.username}
                                                        size="md"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-semibold text-primary">
                                                            {comment.author.username}
                                                        </h4>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(comment.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--forum-search-border)]">
                                                        <p className="nh-text text-sm">
                                                            {comment.body}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Comment pagination */}
                            {!loadingComments && totalComments > 0 && totalCommentPages > 1 && (
                                <div className="flex justify-center items-center mt-6 gap-2">
                                    <button 
                                        onClick={() => handleCommentPageChange(Math.max(1, commentPage - 1))}
                                        disabled={commentPage === 1}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${commentPage === 1 ? 'text-[var(--color-gray-400)] dark:text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'}`}
                                    >
                                        <CaretLeft size={20} weight="bold" />
                                    </button>
                                    
                                    {totalCommentPages <= 5 ? (
                                        // Show all pages if 5 or fewer
                                        [...Array(totalCommentPages)].map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleCommentPageChange(index + 1)}
                                                className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                                    commentPage === index + 1 
                                                    ? 'bg-primary text-white'
                                                    : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))
                                    ) : (
                                        // Show limited range of pages
                                        <>
                                            {/* First page */}
                                            <button
                                                onClick={() => handleCommentPageChange(1)}
                                                className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                                    commentPage === 1 
                                                    ? 'bg-primary text-white' 
                                                    : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                1
                                            </button>
                                            
                                            {/* Ellipsis for many pages */}
                                            {commentPage > 3 && <span className="mx-1 text-[var(--forum-default-text)] dark:text-gray-400">...</span>}
                                            
                                            {/* Pages around current page */}
                                            {Array.from(
                                                { length: Math.min(3, totalCommentPages - 2) },
                                                (_, i) => {
                                                    let pageNum;
                                                    if (commentPage <= 2) {
                                                        pageNum = i + 2; // Show 2, 3, 4
                                                    } else if (commentPage >= totalCommentPages - 1) {
                                                        pageNum = totalCommentPages - Math.min(3, totalCommentPages - 2) + i; // Ensure it shows correct last few pages
                                                    } else {
                                                        pageNum = commentPage - 1 + i; // Show around current
                                                    }
                                                    
                                                    if (pageNum <= 1 || pageNum >= totalCommentPages) return null;
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handleCommentPageChange(pageNum)}
                                                            className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                                                commentPage === pageNum 
                                                                ? 'bg-primary text-white' 
                                                                : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                }
                                            )}
                                            
                                            {/* Ellipsis for many pages */}
                                            {commentPage < totalCommentPages - 2 && <span className="mx-1 text-[var(--forum-default-text)] dark:text-gray-400">...</span>}
                                            
                                            {/* Last page */}
                                            <button
                                                onClick={() => handleCommentPageChange(totalCommentPages)}
                                                className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                                    commentPage === totalCommentPages 
                                                    ? 'bg-primary text-white' 
                                                    : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {totalCommentPages}
                                            </button>
                                        </>
                                    )}
                                    
                                    <button 
                                        onClick={() => handleCommentPageChange(Math.min(totalCommentPages, commentPage + 1))}
                                        disabled={commentPage === totalCommentPages}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${commentPage === totalCommentPages ? 'text-[var(--color-gray-400)] dark:text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'}`}
                                    >
                                        <CaretRight size={20} weight="bold" />
                                    </button>
                                </div>
                            )}
                            
                            {/* Add Comment Form - Moved below comments */}
                            <div className="nh-card rounded-lg shadow-md border border-gray-700">
                                <h3 className="nh-subtitle mb-4">Add a Comment</h3>
                                <form onSubmit={handleCommentSubmit}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                                                <User size={18} weight="fill" className="text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-primary mb-2">You</p>
                                            <textarea 
                                                className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)] transition-all"
                                                rows={3}
                                                placeholder="Share your thoughts..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit" 
                                            className="nh-button nh-button-primary light:hover:bg-blue-400 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                                        >
                                            Post Comment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    {/* End of Middle Column */}

                    {/* Right column - Empty */}
                    <div className="w-full md:w-1/5"></div>
                </div>
                {/* End of three-column layout */}
            </div>
        </div>
    );
};

export default PostDetail; 