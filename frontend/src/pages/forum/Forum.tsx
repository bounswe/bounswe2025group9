// forum page component
import { useState, useEffect } from 'react'
import { User, ThumbsUp, ChatText, PlusCircle, CaretLeft, CaretRight, ChatDots, Tag, X } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { apiClient, ForumPost, ForumTag } from '../../lib/apiClient'

// create a simple cache for posts
let cachedPosts: ForumPost[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Define tag colors based on tag name for consistent display
const getTagStyle = (tagName: string) => {
    // Check for exact tag types from backend
    switch (tagName) {
        case "Dietary tip":
            return { bg: '#e6f7f2', text: '#0d7c5f' }; // Green
        case "Recipe":
            return { bg: '#f0e6ff', text: '#6200ee' }; // Purple
        case "Meal plan":
            return { bg: '#e6f0ff', text: '#0062cc' }; // Blue
        default:
            return { bg: '#f2f2f2', text: '#666666' }; // Grey (fallback)
    }
};

// Hard-coded tag IDs for filtering
const TAG_IDS = {
    "Dietary tip": 1,
    "Recipe": 2,
    "Meal plan": 3
};

const Forum = () => {
    const location = useLocation();
    const [posts, setPosts] = useState<ForumPost[]>(cachedPosts); // initialize with cached posts
    const [loading, setLoading] = useState(cachedPosts.length === 0); // only show loading if no cached posts
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
    
    // State for active filter
    const [activeFilter, setActiveFilter] = useState<number | null>(null);
    const [filterLabel, setFilterLabel] = useState<string | null>(null);
    
    // Calculate total pages based on fetched posts
    const totalPages = Math.ceil(posts.length / postsPerPage);
    
    // Fetch posts when component mounts or when returning to this component
    useEffect(() => {
        fetchPosts();
    }, []);

    // Refresh data when navigating back to this page
    useEffect(() => {
        // Check if we're coming back to the forum from somewhere else
        if (location.pathname === '/forum') {
            fetchPosts();
        }
    }, [location]);

    // Get posts from API
    const fetchPosts = async (tagId?: number) => {
        // check if cache is still valid and we're not changing filters
        const now = Date.now();
        if (
            cachedPosts.length > 0 && 
            now - lastFetchTime < CACHE_DURATION &&
            tagId === undefined && 
            activeFilter === null
        ) {
            // use cached data if available and fresh
            console.log('Using cached forum posts data');
            syncLikedState(cachedPosts);
            return;
        }
        
        // If we're applying a filter, don't use cache
        if (!loading) {
            setLoading(true);
        }
        
        try {
            // Prepare filter parameters
            const params: { 
                tags?: number, 
                ordering: string 
            } = {
                ordering: '-created_at' // Sort by newest first
            };
            
            // Add tag filter if specified
            if (tagId !== undefined) {
                params.tags = tagId;
            } else if (activeFilter !== null) {
                params.tags = activeFilter;
            }
            
            const data = await apiClient.getForumPosts(params);
            
            // update the cache only if no filter is applied
            if (tagId === undefined && activeFilter === null) {
                cachedPosts = data;
                lastFetchTime = now;
            }
            
            // sync liked state with the new data
            syncLikedState(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            // if error and we have cached data, keep using it
            if (cachedPosts.length > 0) {
                console.log('Using cached data due to fetch error');
                syncLikedState(cachedPosts);
            }
        } finally {
            setLoading(false);
        }
    };

    // Apply a tag filter
    const handleFilterByTag = (tagId: number, tagName: string) => {
        if (activeFilter === tagId) {
            // If clicking the active filter, clear it
            setActiveFilter(null);
            setFilterLabel(null);
            fetchPosts(undefined); // Reset to all posts
        } else {
            // Apply the new filter
            setActiveFilter(tagId);
            setFilterLabel(tagName);
            fetchPosts(tagId);
        }
        // Reset to first page
        setCurrentPage(1);
    };

    // Clear active filter
    const clearFilter = () => {
        setActiveFilter(null);
        setFilterLabel(null);
        fetchPosts(undefined);
        setCurrentPage(1);
    };

    // helper function to sync liked state with post data
    const syncLikedState = (postData: ForumPost[]) => {
        // Create a new likedPosts state based on sessionStorage
        const newLikedPosts: {[key: number]: boolean} = {};
        
        // Check sessionStorage for any likes that were set in PostDetail or previously in Forum
        postData.forEach((post: ForumPost) => {
            const storedLiked = sessionStorage.getItem(`post_${post.id}_liked`);
            
            // Update the liked state
            if (storedLiked) {
                newLikedPosts[post.id] = storedLiked === 'true';
            }
        });
        
        // Update state
        setPosts(postData);
        setLikedPosts(newLikedPosts);
        
        // Reset to first page when posts are refreshed (only if data actually changed)
        if (JSON.stringify(postData) !== JSON.stringify(posts)) {
            setCurrentPage(1);
        }
    };

    // Handle like toggling with API
    const handleLikeToggle = async (postId: number) => {
        // Toggle the liked state in UI for immediate feedback
        const isCurrentlyLiked = likedPosts[postId] || false;
        const newLiked = !isCurrentlyLiked;
        
        // Update the liked state immediately
        setLikedPosts(prev => ({
            ...prev,
            [postId]: newLiked
        }));
        
        try {
            // Call the API to like/unlike the post
            if (newLiked) {
                await apiClient.likeItem(postId, "post");
                
                // Store the updated like state in sessionStorage
                sessionStorage.setItem(`post_${postId}_liked`, String(newLiked));
            } else {
                // In a real implementation, there would be an unlike API
                // This is a mock for demonstration purposes
                console.log('Unlike post:', postId);
                
                // Update sessionStorage
                sessionStorage.setItem(`post_${postId}_liked`, String(newLiked));
            }
        } catch (error) {
            console.error('Error toggling post like:', error);
            
            // Revert UI change if API call fails
            setLikedPosts(prev => ({
                ...prev,
                [postId]: isCurrentlyLiked
            }));
            
            // Update sessionStorage
            sessionStorage.setItem(`post_${postId}_liked`, String(isCurrentlyLiked));
        }
    };

    // Get current posts for pagination
    const getCurrentPosts = () => {
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return posts.slice(indexOfFirstPost, indexOfFirstPost + postsPerPage);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top when changing page
        window.scrollTo(0, 0);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // We need to re-check session storage when the component regains focus
    // This ensures updates from PostDetail are reflected if user navigates back
    useEffect(() => {
        const handleFocus = () => {
            // Re-sync with sessionStorage for any changes when the user returns to this page
            const updatedLikedPosts = { ...likedPosts };
            let needsUpdate = false;
            
            posts.forEach(post => {
                const storedLiked = sessionStorage.getItem(`post_${post.id}_liked`);
                
                if (storedLiked !== null) {
                    const isLiked = storedLiked === 'true';
                    if (updatedLikedPosts[post.id] !== isLiked) {
                        updatedLikedPosts[post.id] = isLiked;
                        needsUpdate = true;
                    }
                }
            });
            
            if (needsUpdate) {
                setLikedPosts({ ...updatedLikedPosts });
                
                // Also, trigger a refresh if it's been a while since the last fetch
                const now = Date.now();
                if (now - lastFetchTime > CACHE_DURATION) {
                    fetchPosts();
                }
            }
        };
        
        // Add event listener for when window regains focus
        window.addEventListener('focus', handleFocus);
        
        // Cleanup
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [posts, likedPosts]);

    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="mb-8">
                    <h1 className="nh-title text-center mb-6">Community Forum</h1>

                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
                            {/* Filter buttons */}
                            <button 
                                onClick={() => handleFilterByTag(TAG_IDS["Dietary tip"], "Dietary tip")}
                                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeFilter === TAG_IDS["Dietary tip"] 
                                    ? 'bg-[#0d7c5f] text-white' 
                                    : 'bg-[#e6f7f2] text-[#0d7c5f] hover:bg-[#d0efe6]'
                                }`}
                            >
                                <Tag size={16} className="flex-shrink-0" />
                                <span>Dietary Tips</span>
                            </button>
                            
                            <button 
                                onClick={() => handleFilterByTag(TAG_IDS["Recipe"], "Recipe")}
                                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeFilter === TAG_IDS["Recipe"] 
                                    ? 'bg-[#6200ee] text-white' 
                                    : 'bg-[#f0e6ff] text-[#6200ee] hover:bg-[#e6d0ff]'
                                }`}
                            >
                                <Tag size={16} className="flex-shrink-0" />
                                <span>Recipes</span>
                            </button>
                            
                            <button 
                                onClick={() => handleFilterByTag(TAG_IDS["Meal plan"], "Meal plan")}
                                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeFilter === TAG_IDS["Meal plan"] 
                                    ? 'bg-[#0062cc] text-white' 
                                    : 'bg-[#e6f0ff] text-[#0062cc] hover:bg-[#d0e6ff]'
                                }`}
                            >
                                <Tag size={16} className="flex-shrink-0" />
                                <span>Meal Plans</span>
                            </button>
                            
                            {activeFilter !== null && (
                                <button 
                                    onClick={clearFilter}
                                    className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    <X size={16} className="flex-shrink-0" />
                                    <span>Clear Filter</span>
                                </button>
                            )}
                        </div>
                        
                        {/* New Post button */}
                        <Link to="/forum/create" className="nh-button nh-button-primary flex items-center gap-2">
                            <PlusCircle size={20} weight="fill" />
                            New Post
                        </Link>
                    </div>
                    
                    {/* Active filter indicator */}
                    {filterLabel && (
                        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                            <p className="text-sm text-center">
                                Showing posts tagged with: <span className="font-medium">{filterLabel}</span>
                            </p>
                        </div>
                    )}
                </div>
                
                {loading ? (
                    <div className="text-center my-12">
                        <p className="text-lg">Loading posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center my-12">
                        <p className="text-lg">
                            {activeFilter !== null 
                                ? `No posts found with the selected tag. Try another filter or create a new post.` 
                                : `No posts found. Be the first to create a post!`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {getCurrentPosts().map((post) => (
                            <div key={post.id} className="nh-card relative">
                                {/* Add clickable overlay that links to post detail */}
                                <Link 
                                    to={`/forum/post/${post.id}`}
                                    className="absolute inset-0 z-10"
                                    aria-label={`View post: ${post.title}`}
                                />
                                
                                <div className="flex items-center mb-2">
                                    <div className="mt-0.5 mr-2">
                                        <ChatText size={20} weight="fill" className="text-primary flex-shrink-0" />
                                    </div>
                                    <h3 className="nh-subtitle">{post.title}</h3>
                                </div>
                                
                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {post.tags.map((tag) => {
                                            const tagStyle = getTagStyle(tag.name);
                                            return (
                                                <div 
                                                    key={tag.id} 
                                                    className="flex items-center px-2 py-1 rounded-md text-xs font-medium z-20 relative" 
                                                    style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}
                                                >
                                                    <Tag size={12} className="mr-1" />
                                                    {tag.name}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                <p className="nh-text mb-4">
                                    {post.body.length > 150 
                                        ? post.body.substring(0, 150) + '...' 
                                        : post.body}
                                </p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <div className="mt-0.5">
                                            <User size={16} className="flex-shrink-0" />
                                        </div>
                                        Posted by: {post.author.username} • {formatDate(post.created_at)}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <Link 
                                            to={`/forum/post/${post.id}`}
                                            className="flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 relative z-20"
                                        >
                                            <div className="mt-0.5">
                                                <ChatDots size={16} className="flex-shrink-0" />
                                            </div>
                                            Comments
                                        </Link>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLikeToggle(post.id);
                                            }}
                                            className={`flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${likedPosts[post.id] ? 'text-primary' : ''} relative z-20`}
                                        >
                                            <div className="mt-0.5">
                                                <ThumbsUp size={16} weight={likedPosts[post.id] ? "fill" : "regular"} className="flex-shrink-0" />
                                            </div>
                                            {/* Note: We'll need to update this when the backend adds likes */}
                                            Likes: 0
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination - only show if we have posts and more than one page */}
                {!loading && posts.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                        <button 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-gray-100'}`}
                        >
                            <CaretLeft size={20} weight="bold" />
                        </button>
                        
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(index + 1)}
                                className={`w-8 h-8 rounded-full ${
                                    currentPage === index + 1 
                                    ? 'bg-[#0d7c5f] dark:bg-[#090909] text-white' 
                                    : 'text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-500'
                                }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                        
                        <button 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-gray-100'}`}
                        >
                            <CaretRight size={20} weight="bold" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Forum