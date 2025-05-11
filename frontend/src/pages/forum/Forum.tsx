// forum page component
import { useState, useEffect } from 'react'
import { User, ThumbsUp, ChatText, PlusCircle, CaretLeft, CaretRight, ChatDots, Tag, X, Funnel } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { apiClient, ForumPost, ForumTag, PaginatedResponse } from '../../lib/apiClient'

// create a simple cache for posts
let cachedPosts: ForumPost[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Define tag colors based on tag name for consistent display
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
        case "Meal plan":
            return { 
                bg: 'var(--forum-mealplan-bg)',
                text: 'var(--forum-mealplan-text)',
                activeBg: 'var(--forum-mealplan-active-bg)',
                activeText: 'var(--forum-mealplan-active-text)',
                hoverBg: 'var(--forum-mealplan-hover-bg)'
            };
        default:
            return { 
                bg: 'var(--forum-default-bg)',
                text: 'var(--forum-default-text)',
                activeBg: 'var(--forum-default-active-bg)',
                activeText: 'var(--forum-default-active-text)',
                hoverBg: 'var(--forum-default-hover-bg)'
            };
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
    const [allPosts, setAllPosts] = useState<ForumPost[]>(cachedPosts); // store all posts
    const [posts, setPosts] = useState<ForumPost[]>([]); // store current page posts
    const [loading, setLoading] = useState(cachedPosts.length === 0); // only show loading if no cached posts
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(5);
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
    
    // State for active filter
    const [activeFilter, setActiveFilter] = useState<number | null>(null);
    const [filterLabel, setFilterLabel] = useState<string | null>(null);
    
    // Calculate total pages based on filtered posts count
    const totalPages = Math.ceil(totalCount / postsPerPage);
    
    // Apply pagination to filtered posts
    useEffect(() => {
        if (allPosts.length > 0) {
            const filteredPosts = activeFilter 
                ? allPosts.filter(post => post.tags.some(tag => tag.id === activeFilter))
                : allPosts;
                
            setTotalCount(filteredPosts.length);
            
            // Get current page posts
            const indexOfLastPost = currentPage * postsPerPage;
            const indexOfFirstPost = indexOfLastPost - postsPerPage;
            const currentPosts = filteredPosts.slice(indexOfFirstPost, Math.min(indexOfLastPost, filteredPosts.length));
            
            setPosts(currentPosts);
            syncLikedState(currentPosts);
        }
    }, [allPosts, currentPage, postsPerPage, activeFilter]);
    
    // Fetch posts when component mounts or when returning to this component
    useEffect(() => {
        fetchAllPosts();
    }, []);

    // Refresh data when navigating back to this page
    useEffect(() => {
        // Check if we're coming back to the forum from somewhere else
        if (location.pathname === '/forum') {
            fetchAllPosts();
        }
    }, [location]);

    // Get all posts from API
    const fetchAllPosts = async () => {
        // check if cache is still valid
        const now = Date.now();
        
        if (cachedPosts.length > 0 && now - lastFetchTime < CACHE_DURATION) {
            // use cached data if available and fresh
            console.log('Using cached forum posts data');
            setAllPosts(cachedPosts);
            return;
        }
        
        if (!loading) {
            setLoading(true);
        }
        
        try {
            // Request all posts with a large page_size
            const params = {
                ordering: '-created_at', // Sort by newest first
                page: 1,
                page_size: 100 // Get a large number of posts in one request
            };
            
            console.log(`Fetching all posts with params:`, params);
            
            const response = await apiClient.getForumPosts(params);
            console.log(`Fetched ${response.results.length} posts, total: ${response.count}`);
            
            // Update cached posts
            cachedPosts = response.results;
            lastFetchTime = now;
            
            // If there are more posts than the page size, make additional requests
            if (response.count > response.results.length && response.next) {
                const allResults = [...response.results];
                let nextUrl: string | null = response.next;
                
                while (nextUrl && allResults.length < response.count) {
                    // Extract page from next URL
                    try {
                        const url = new URL(nextUrl);
                        const page = url.searchParams.get('page');
                        
                        if (page) {
                            const pageNum = parseInt(page);
                            const nextPageResponse = await apiClient.getForumPosts({
                                ...params,
                                page: pageNum
                            });
                            
                            allResults.push(...nextPageResponse.results);
                            nextUrl = nextPageResponse.next;
                        } else {
                            break;
                        }
                    } catch (err) {
                        console.error('Error parsing next URL:', err);
                        break;
                    }
                }
                
                // Update with all fetched posts
                cachedPosts = allResults;
                console.log(`Fetched all ${allResults.length} posts`);
            }
            
            setAllPosts(cachedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            // if error and we have cached data, keep using it
            if (cachedPosts.length > 0) {
                console.log('Using cached data due to fetch error');
                setAllPosts(cachedPosts);
            } else {
                // Set empty posts array to prevent infinite loading state
                setAllPosts([]);
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
        } else {
            // Apply the new filter
            setActiveFilter(tagId);
            setFilterLabel(tagName);
        }
        // Reset to first page when changing filters
        setCurrentPage(1);
    };

    // Clear active filter
    const clearFilter = () => {
        setActiveFilter(null);
        setFilterLabel(null);
        setCurrentPage(1); // Reset to first page
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
        setLikedPosts(newLikedPosts);
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

    // Get current posts - not needed as we're now handling pagination in the useEffect
    const getCurrentPosts = () => {
        return posts;
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
                    fetchAllPosts();
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
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="mb-8 flex flex-col items-center">
                    <h1 className="nh-title text-center">Community Forum</h1>
                    <p className="nh-text text-lg max-w-2xl text text-center">
                        Connect with others, share recipes, and get nutrition advice from our community.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Filters */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20">
                            <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                                <Funnel size={20} weight="fill" className="text-primary" />
                                Filter Posts
                            </h3>
                            <div className="flex flex-col gap-3">
                                {/* Filter buttons */}
                                <button 
                                    onClick={() => handleFilterByTag(TAG_IDS["Dietary tip"], "Dietary tip")}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                    style={{
                                        backgroundColor: activeFilter === TAG_IDS["Dietary tip"] 
                                            ? getTagStyle("Dietary tip").activeBg 
                                            : getTagStyle("Dietary tip").bg,
                                        color: activeFilter === TAG_IDS["Dietary tip"] 
                                            ? getTagStyle("Dietary tip").activeText 
                                            : getTagStyle("Dietary tip").text
                                    }}
                                >
                                    <Tag size={18} weight="fill" className="flex-shrink-0" />
                                    <span className="flex-grow text-center">Dietary Tips</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleFilterByTag(TAG_IDS["Recipe"], "Recipe")}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                    style={{
                                        backgroundColor: activeFilter === TAG_IDS["Recipe"] 
                                            ? getTagStyle("Recipe").activeBg 
                                            : getTagStyle("Recipe").bg,
                                        color: activeFilter === TAG_IDS["Recipe"] 
                                            ? getTagStyle("Recipe").activeText 
                                            : getTagStyle("Recipe").text
                                    }}
                                >
                                    <Tag size={18} weight="fill" className="flex-shrink-0" />
                                    <span className="flex-grow text-center">Recipes</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleFilterByTag(TAG_IDS["Meal plan"], "Meal plan")}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                    style={{
                                        backgroundColor: activeFilter === TAG_IDS["Meal plan"] 
                                            ? getTagStyle("Meal plan").activeBg 
                                            : getTagStyle("Meal plan").bg,
                                        color: activeFilter === TAG_IDS["Meal plan"] 
                                            ? getTagStyle("Meal plan").activeText 
                                            : getTagStyle("Meal plan").text
                                    }}
                                >
                                    <Tag size={18} weight="fill" className="flex-shrink-0" />
                                    <span className="flex-grow text-center">Meal Plans</span>
                                </button>
                                
                                {activeFilter !== null && (
                                    <button 
                                        onClick={clearFilter}
                                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <X size={18} weight="bold" className="flex-shrink-0" />
                                        <span className="flex-grow text-center">Clear Filter</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle column - Posts */}
                    <div className="w-full md:w-3/5">
                        {/* Active filter indicator */}
                        {filterLabel && (
                            <div className="mb-6 p-3 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700">
                                <p className="text-sm text-center nh-text">
                                    Showing posts tagged with: <span className="font-medium">{filterLabel}</span>
                                </p>
                            </div>
                        )}
                        
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
                            <div className="space-y-6">
                                {getCurrentPosts().map((post) => (
                                    <div key={post.id} className="nh-card relative">
                                        {/* Add clickable overlay that links to post detail */}
                                        <Link 
                                            to={`/forum/post/${post.id}`}
                                            className="absolute inset-0 z-10"
                                            aria-label={`View post: ${post.title}`}
                                        />
                                        
                                        <div className="flex items-center mb-2">
                                            <div className="flex items-center justify-center mr-3">
                                                <ChatText size={24} weight="fill" className="text-primary" />
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
                                                            style={{ 
                                                                backgroundColor: tagStyle.bg, 
                                                                color: tagStyle.text 
                                                            }}
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
                                                <div className="flex items-center justify-center">
                                                    <User size={16} className="flex-shrink-0" />
                                                </div>
                                                Posted by: {post.author.username} • {formatDate(post.created_at)}
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <Link 
                                                    to={`/forum/post/${post.id}`}
                                                    className="flex items-center gap-1 transition-colors duration-200 rounded-md px-3 py-1.5 hover:bg-gray-700 relative z-20"
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <ChatDots size={16} weight="fill" className="flex-shrink-0" />
                                                    </div>
                                                    Comments
                                                </Link>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLikeToggle(post.id);
                                                    }}
                                                    className={`flex items-center gap-1 transition-colors duration-200 rounded-md px-3 py-1.5 hover:bg-gray-700 ${likedPosts[post.id] ? 'text-primary' : ''} relative z-20`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <ThumbsUp size={16} weight={likedPosts[post.id] ? "fill" : "regular"} className="flex-shrink-0" />
                                                    </div>
                                                    Likes: 0
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination - only show if we have posts and more than one page */}
                        {!loading && totalCount > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center mt-10 gap-2">
                                <button 
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
                                >
                                    <CaretLeft size={20} weight="bold" />
                                </button>
                                
                                {totalPages <= 5 ? (
                                    // Show all pages if 5 or fewer
                                    [...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(index + 1)}
                                            className={`w-10 h-10 rounded-full transition-all ${
                                                currentPage === index + 1 
                                                ? 'bg-primary text-white shadow' 
                                                : 'text-gray-400 hover:bg-gray-800 hover:shadow'
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
                                            onClick={() => handlePageChange(1)}
                                            className={`w-10 h-10 rounded-full transition-all ${
                                                currentPage === 1 
                                                ? 'bg-primary text-white shadow' 
                                                : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                            }`}
                                        >
                                            1
                                        </button>
                                        
                                        {/* Ellipsis for many pages */}
                                        {currentPage > 3 && <span className="mx-1">...</span>}
                                        
                                        {/* Pages around current page */}
                                        {Array.from(
                                            { length: Math.min(3, totalPages - 2) },
                                            (_, i) => {
                                                let pageNum;
                                                if (currentPage <= 2) {
                                                    pageNum = i + 2; // Show 2, 3, 4
                                                } else if (currentPage >= totalPages - 1) {
                                                    pageNum = totalPages - 3 + i; // Show last 3 pages before the last
                                                } else {
                                                    pageNum = currentPage - 1 + i; // Show around current
                                                }
                                                
                                                if (pageNum <= 1 || pageNum >= totalPages) return null;
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-10 h-10 rounded-full transition-all ${
                                                            currentPage === pageNum 
                                                            ? 'bg-primary text-white shadow' 
                                                            : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            }
                                        )}
                                        
                                        {/* Ellipsis for many pages */}
                                        {currentPage < totalPages - 2 && <span className="mx-1">...</span>}
                                        
                                        {/* Last page */}
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className={`w-10 h-10 rounded-full transition-all ${
                                                currentPage === totalPages 
                                                ? 'bg-primary text-white shadow' 
                                                : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                            }`}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                                
                                <button 
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
                                >
                                    <CaretRight size={20} weight="bold" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right column - Actions */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20 flex flex-col gap-4">
                            <Link to="/forum/create" className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium">
                                <div className="flex items-center justify-center w-full">
                                    <PlusCircle size={22} weight="fill" className="mr-2" />
                                    New Post
                                </div>
                            </Link>
                            
                            <div className="nh-card rounded-lg shadow-md">
                                <h3 className="nh-subtitle mb-3 text-sm">Forum Rules</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Be respectful to others</li>
                                    <li>• Share verified nutrition info</li>
                                    <li>• Use appropriate tags</li>
                                    <li>• Ask questions clearly</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Forum