// forum page component
import { useState, useEffect } from 'react'
import { PlusCircle, CaretLeft, CaretRight, Tag, X, Funnel, MagnifyingGlass } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiClient, ForumPost } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'
import ForumPostCard from '../../components/ForumPostCard'
// import cross-tab notification system
import { notifyLikeChange, subscribeLikeChanges } from '../../lib/likeNotifications';

// local storage key for liked posts (keep for direct localStorage access)
const LIKED_POSTS_STORAGE_KEY = 'nutriHub_likedPosts';

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

// Hard-coded tag IDs for filtering - these will be updated dynamically
const TAG_IDS = {
    "Dietary tip": 1,
    "Recipe": 2,
    "Meal plan": 3,
    "Vegan": 4,
    "Halal": 5,
    "High-Protein": 6
};

const Forum = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const username = user?.username || 'anonymous';
    // initialize allPosts as empty array
    const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
    const [posts, setPosts] = useState<ForumPost[]>([]); // store current page posts
    // show loading initially
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, ] = useState(5);
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
    
    // State for active filter
    const [activeFilter, setActiveFilter] = useState<number | null>(null);
    const [filterLabel, setFilterLabel] = useState<string | null>(null);
    const [selectedSubTags, setSelectedSubTags] = useState<number[]>([]);
    const [selectedSubTagLabels, setSelectedSubTagLabels] = useState<string[]>([]);
    
    // Search related state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<ForumPost[]>([]);
    const [searchResultsCount, setSearchResultsCount] = useState<number>(0);
    
    // helper to get liked posts for the current user from local storage
    const getUserLikedPostsFromStorage = (): {[key: number]: boolean} => {
        const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
        if (storedLikedPosts) {
            try {
                const parsedData = JSON.parse(storedLikedPosts);
                return parsedData[username] || {};
            } catch (error) {
                console.error('Error parsing liked posts from localStorage:', error);
                localStorage.removeItem(LIKED_POSTS_STORAGE_KEY); // Clear corrupted data
                return {};
            }
        }
        return {};
    };

    // Track previous location to detect navigation from PostDetail and sync liked posts from server
    useEffect(() => {
        const init = async () => {
            try {
                // 1) Fetch liked posts from server and sync localStorage/state
                const likedMapFromServer = await fetchAndSyncLikedPostsFromServer();
                setLikedPosts(likedMapFromServer);
            } catch (e) {
                // fallback to local storage on error
                setLikedPosts(getUserLikedPostsFromStorage());
            }

            // 2) Fetch posts
            if (location.state?.refreshPosts) {
                console.log('[Forum] Forcing refresh due to new post creation or external update.');
                await fetchAllPosts(true);
                navigate(location.pathname, { replace: true, state: {} });
            } else {
                await fetchAllPosts();
            }
        };
        init();

        // Subscribe to cross-tab like changes
        const unsubscribe = subscribeLikeChanges((event) => {
            if (event.type !== 'post') return;
            // Update local liked map and allPosts in-place with both liked status and like count
            setLikedPosts(prev => ({ ...prev, [event.postId]: event.isLiked }));
            setAllPosts(prev => prev.map(p => p.id === event.postId ? { ...p, liked: event.isLiked, likes: event.likeCount } : p));
        });

        // Poll server every 5 seconds to refresh posts and keep everything in sync
        const intervalId = window.setInterval(async () => {
            try {
                // Fetch the latest posts from server
                const params = {
                    ordering: '-created_at',
                    page: 1,
                    page_size: 500
                };
                const response = await apiClient.getForumPosts(params);
                
                // Get current liked posts from server
                const likedMapFromServer = await fetchAndSyncLikedPostsFromServer();
                
                // Merge server data with liked status
                const updatedPosts = response.results.map(post => ({
                    ...post,
                    author: post.author || { id: 0, username: 'Anonymous' },
                    liked: likedMapFromServer[post.id] !== undefined ? likedMapFromServer[post.id] : (post.liked || false),
                }));
                
                // Update state
                setAllPosts(updatedPosts);
                setLikedPosts(likedMapFromServer);
            } catch {
                // ignore polling errors silently
            }
        }, 5000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [location, username, navigate]);
    
    // Calculate total pages based on filtered posts count
    const totalPages = Math.ceil(totalCount / postsPerPage);
    
    // Apply pagination to filtered posts
    useEffect(() => {
        if (isSearching && (activeFilter || selectedSubTags.length > 0)) {
            // When both searching and filtering, show intersection
            let filteredSearchResults = searchResults;
            
            // Apply main filter
            if (activeFilter) {
                filteredSearchResults = filteredSearchResults.filter(post => 
                    post.tags.some(tag => tag.id === activeFilter)
                );
            }
            
            // Apply sub-filter (requires both Recipe tag and ALL selected sub-tags)
            if (selectedSubTags.length > 0) {
                filteredSearchResults = filteredSearchResults.filter(post => 
                    post.tags.some(tag => tag.id === TAG_IDS["Recipe"]) &&
                    selectedSubTags.every(subTagId => 
                        post.tags.some(tag => tag.id === subTagId)
                    )
                );
            }
            
            setTotalCount(filteredSearchResults.length);
            
            // Get current page posts from filtered search results
            const indexOfLastPost = currentPage * postsPerPage;
            const indexOfFirstPost = indexOfLastPost - postsPerPage;
            const currentPosts = filteredSearchResults.slice(indexOfFirstPost, Math.min(indexOfLastPost, filteredSearchResults.length));
            
            setPosts(currentPosts);
        } else if (isSearching) {
            // When only searching, use search results
            setTotalCount(searchResultsCount);
            
            // Get current page posts from search results
            const indexOfLastPost = currentPage * postsPerPage;
            const indexOfFirstPost = indexOfLastPost - postsPerPage;
            const currentPosts = searchResults.slice(indexOfFirstPost, Math.min(indexOfLastPost, searchResults.length));
            
            setPosts(currentPosts);
        } else if (allPosts.length > 0) {
            // When only filtering or no filters, use allPosts
            let filteredPosts = allPosts;
            
            // Apply main filter
            if (activeFilter) {
                filteredPosts = filteredPosts.filter(post => 
                    post.tags.some(tag => tag.id === activeFilter)
                );
            }
            
            // Apply sub-filter (requires both Recipe tag and ALL selected sub-tags)
            if (selectedSubTags.length > 0) {
                filteredPosts = filteredPosts.filter(post => 
                    post.tags.some(tag => tag.id === TAG_IDS["Recipe"]) &&
                    selectedSubTags.every(subTagId => 
                        post.tags.some(tag => tag.id === subTagId)
                    )
                );
            }
                
            setTotalCount(filteredPosts.length);
            
            // Get current page posts
            const indexOfLastPost = currentPage * postsPerPage;
            const indexOfFirstPost = indexOfLastPost - postsPerPage;
            const currentPosts = filteredPosts.slice(indexOfFirstPost, Math.min(indexOfLastPost, filteredPosts.length));
            
            setPosts(currentPosts);
        }
    }, [allPosts, currentPage, postsPerPage, activeFilter, selectedSubTags, isSearching, searchResults, searchResultsCount]);
    
    // Fetch posts when component mounts or when returning to this component
    useEffect(() => {
        fetchAllPosts();
    }, []);

    // Get all posts from API
    const fetchAllPosts = async (_forceRefresh = false) => {
        if (!loading) {
            setLoading(true);
        }

        try {
            const params = {
                ordering: '-created_at',
                page: 1,
                page_size: 500 // fetch a large number, maybe adjust based on typical count
            };
            console.log(`Fetching all posts with params:`, params);
            const response = await apiClient.getForumPosts(params);
            console.log(`Fetched ${response.results.length} posts, total: ${response.count}`);

            // Use local storage as the primary source of truth for liked status
            const userLikedPosts = getUserLikedPostsFromStorage();

            const fetchedPosts = response.results.map(post => {
                return {
                    ...post,
                    // author is now an object with id and username from the backend
                    author: post.author || { id: 0, username: 'Anonymous' },
                    liked: userLikedPosts[post.id] !== undefined ? userLikedPosts[post.id] : (post.liked || false),
                };
            });

            // Handle pagination if necessary (though large page_size reduces need)
            let allResults = [...fetchedPosts];
            let nextUrl: string | null = response.next;
            let currentPageNum = 1;

            while (nextUrl && allResults.length < response.count) {
                currentPageNum++;
                try {
                    const nextPageResponse = await apiClient.getForumPosts({ ...params, page: currentPageNum });
                    const nextPagePosts = nextPageResponse.results.map(post => {
                        return {
                            ...post,
                            // author is now an object with id and username from the backend
                            author: post.author || { id: 0, username: 'Anonymous' },
                            liked: userLikedPosts[post.id] !== undefined ? userLikedPosts[post.id] : (post.liked || false),
                        };
                    });
                    allResults.push(...nextPagePosts);
                    nextUrl = nextPageResponse.next;
                } catch (err) {
                    console.error(`Error fetching page ${currentPageNum} of posts:`, err);
                    break; // stop fetching if a page fails
                }
            }

            console.log(`Fetched a total of ${allResults.length} posts after pagination.`);

            // Update local state
            setAllPosts(allResults);
            setLikedPosts(userLikedPosts); // ensure liked state is current

        } catch (error) {
            console.error('Error fetching posts:', error);
            setAllPosts([]); // prevent infinite loading
        } finally {
            setLoading(false);
        }
    };

    // Fetch liked posts from server and sync localStorage for current user
    const fetchAndSyncLikedPostsFromServer = async (): Promise<{[key: number]: boolean}> => {
        try {
            const response = await apiClient.getLikedPosts();
            const likedMap: { [key: number]: boolean } = {};
            (response.results || []).forEach(post => {
                likedMap[post.id] = true;
            });

            // Merge into per-user structure in localStorage
            const stored = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let allUsers: { [uname: string]: { [pid: number]: boolean } } = {};
            if (stored) {
                try { allUsers = JSON.parse(stored); } catch { allUsers = {}; }
            }
            const updatedAllUsers = { ...allUsers, [username]: likedMap };
            localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(updatedAllUsers));

            // Also update existing posts liked flag locally to reflect server truth
            setAllPosts(prev => prev.map(p => ({ ...p, liked: likedMap[p.id] !== undefined ? likedMap[p.id] : p.liked })));

            return likedMap;
        } catch (error) {
            console.error('[Forum] Failed to fetch liked posts from server:', error);
            return getUserLikedPostsFromStorage();
        }
    };

    // Apply a tag filter
    const handleFilterByTag = (tagId: number, tagName: string) => {
        if (activeFilter === tagId) {
            // If clicking the active filter, clear it
            setActiveFilter(null);
            setFilterLabel(null);
            // Also clear sub-tags when main filter is cleared
            setSelectedSubTags([]);
            setSelectedSubTagLabels([]);
        } else {
            // Apply the new filter
            setActiveFilter(tagId);
            setFilterLabel(tagName);
            // Clear sub-tags when changing main filter
            setSelectedSubTags([]);
            setSelectedSubTagLabels([]);
        }
        // Reset to first page when changing filters
        setCurrentPage(1);
    };

    // Toggle a sub-tag filter - add/remove from selected sub-tags
    const toggleSubTagFilter = (tagId: number, tagName: string) => {
        setSelectedSubTags(prev => {
            if (prev.includes(tagId)) {
                // Remove tag if already selected
                return prev.filter(id => id !== tagId);
            } else {
                // Add tag if not selected
                return [...prev, tagId];
            }
        });
        
        setSelectedSubTagLabels(prev => {
            if (prev.includes(tagName)) {
                // Remove label if already selected
                return prev.filter(label => label !== tagName);
            } else {
                // Add label if not selected
                return [...prev, tagName];
            }
        });
        
        // Reset to first page when changing filters
        setCurrentPage(1);
    };

    // Clear active filter
    const clearFilter = () => {
        setActiveFilter(null);
        setFilterLabel(null);
        setSelectedSubTags([]);
        setSelectedSubTagLabels([]);
        setCurrentPage(1); // Reset to first page
        
        // Clear search if active
        if (isSearching) {
            clearSearch();
        }
    };

    // Handle searching for posts
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!searchQuery.trim()) {
            // If search query is empty, clear search
            clearSearch();
            return;
        }
        
        setLoading(true);
        setIsSearching(true);
        setCurrentPage(1); // Reset to first page for search results
        
        try {
            const response = await apiClient.searchForumPosts(searchQuery);
            console.log(`[Forum] Search results for "${searchQuery}":`, response);
            
            // Use local storage as the primary source of truth for liked status
            const userLikedPosts = getUserLikedPostsFromStorage();
            
            const searchPosts = response.results.map(post => {
                return {
                    ...post,
                    // author is now an object with id and username from the backend
                    author: post.author || { id: 0, username: 'Anonymous' },
                    liked: userLikedPosts[post.id] !== undefined ? userLikedPosts[post.id] : (post.liked || false),
                };
            });
            
            setSearchResults(searchPosts);
            setSearchResultsCount(response.count);
            
            // Don't clear active filter when searching - allow both to be active
        } catch (error) {
            console.error('[Forum] Error searching for posts:', error);
            // Keep showing current posts on error
            setSearchResults([]);
            setSearchResultsCount(0);
        } finally {
            setLoading(false);
        }
    };
    
    // Clear search results and return to normal view
    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
        setSearchResultsCount(0);
        setCurrentPage(1); // Reset to first page
    };

    // Helper function to update a single post's like status in local storage
    const updateSinglePostLikeInStorage = (postId: number, isLiked: boolean) => {
        try {
            const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let allUsersLikedPosts: {[username: string]: {[postId: number]: boolean}} = {};
            
            if (storedLikedPosts) {
                allUsersLikedPosts = JSON.parse(storedLikedPosts);
            }
            
            // get current user's liked posts or create empty object
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
            
            return updatedUserLikedPosts;
        } catch (error) {
            console.error('Error saving liked posts to localStorage:', error);
            return likedPosts; // Return current state
        }
    };

    // Handle like toggling with API and shared cache
    const handleLikeToggle = async (postId: number) => {
        try {
            console.log(`[Forum] Toggling like for post ID: ${postId}`);

            const currentPost = allPosts.find(p => p.id === postId);
            if (!currentPost) {
                console.error('Post not found in local state');
                return;
            }

            const currentLiked = likedPosts[postId] || false;
            const newLiked = !currentLiked;
            const likeDelta = newLiked ? 1 : -1;
            const currentLikeCount = Math.max(0, currentPost.likes || 0); // Ensure non-negative
            const optimisticLikeCount = Math.max(0, currentLikeCount + likeDelta); // Ensure non-negative

            // 1. Update local storage first (our source of truth for liked status)
            const updatedUserLikedPosts = updateSinglePostLikeInStorage(postId, newLiked);

            // 2. Optimistically update the UI state (allPosts and likedPosts)
            setLikedPosts(updatedUserLikedPosts);
            const updatedAllPosts = allPosts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        liked: newLiked,
                        likes: optimisticLikeCount // use optimistic count for now
                    };
                }
                return post;
            });
            setAllPosts(updatedAllPosts);

            // 3. Call the API to persist the change
            const response = await apiClient.toggleLikePost(postId);
            console.log(`[Forum] Toggle like API response:`, response);

            // 5. Get actual values from server response
            const responseObj = response as any;
            const serverLiked = responseObj.liked;
            const serverLikeCount = responseObj.like_count;

            // ALWAYS use server values as the source of truth
            const finalLiked = serverLiked !== undefined ? serverLiked : newLiked;
            const finalLikeCount = serverLikeCount !== undefined ? serverLikeCount : optimisticLikeCount;

            console.log(`[Forum] Server response - liked: ${finalLiked}, count: ${finalLikeCount}`);

            // 5. Update local storage with server values
            updateSinglePostLikeInStorage(postId, finalLiked);
            setLikedPosts(prevState => ({ ...prevState, [postId]: finalLiked }));

            // 6. Update state with server values
            const correctedAllPosts = allPosts.map(post => {
                if (post.id === postId) {
                    return { ...post, liked: finalLiked, likes: finalLikeCount };
                }
                return post;
            });
            setAllPosts(correctedAllPosts);
            
            // 7. Notify other tabs with ACTUAL server values
            notifyLikeChange(postId, finalLiked, finalLikeCount, 'post');

        } catch (error) {
            console.error('[Forum] Error toggling post like:', error);

            // Revert UI changes on error
            const currentPost = allPosts.find(p => p.id === postId);
            if (currentPost) {
                const originalLiked = likedPosts[postId] || false;
                const revertedLikedStatus = !originalLiked; // the state before the failed toggle attempt

                // Revert local storage
                const revertedUserLikedPosts = updateSinglePostLikeInStorage(postId, revertedLikedStatus);
                setLikedPosts(revertedUserLikedPosts);

                // Revert allPosts state
                const revertedAllPosts = allPosts.map(post => {
                    if (post.id === postId) {
                        // find the original likes count before the optimistic update attempt
                        const originalLikes = Math.max(0, (post.likes || 0) + (originalLiked ? 1 : -1));
                        return { ...post, liked: revertedLikedStatus, likes: originalLikes };
                    }
                    return post;
                });
                setAllPosts(revertedAllPosts);
            }
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

 

    return (
        <div className="w-full py-12">
            <div className="nh-container">
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
                                
                                {/* Recipe Sub-tags - Only show when Recipe is selected */}
                                {activeFilter === TAG_IDS["Recipe"] && (
                                    <>
                                        <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1">Recipe Filters:</p>
                                        
                                        <button 
                                            onClick={() => toggleSubTagFilter(TAG_IDS["Vegan"], "Vegan")}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                            style={{
                                                backgroundColor: selectedSubTags.includes(TAG_IDS["Vegan"]) 
                                                    ? getTagStyle("Vegan").activeBg 
                                                    : getTagStyle("Vegan").bg,
                                                color: selectedSubTags.includes(TAG_IDS["Vegan"]) 
                                                    ? getTagStyle("Vegan").activeText 
                                                    : getTagStyle("Vegan").text
                                            }}
                                        >
                                            <Tag size={18} weight="fill" className="flex-shrink-0" />
                                            <span className="flex-grow text-center">Vegan</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => toggleSubTagFilter(TAG_IDS["Halal"], "Halal")}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                            style={{
                                                backgroundColor: selectedSubTags.includes(TAG_IDS["Halal"]) 
                                                    ? getTagStyle("Halal").activeBg 
                                                    : getTagStyle("Halal").bg,
                                                color: selectedSubTags.includes(TAG_IDS["Halal"]) 
                                                    ? getTagStyle("Halal").activeText 
                                                    : getTagStyle("Halal").text
                                            }}
                                        >
                                            <Tag size={18} weight="fill" className="flex-shrink-0" />
                                            <span className="flex-grow text-center">Halal</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => toggleSubTagFilter(TAG_IDS["High-Protein"], "High-Protein")}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                            style={{
                                                backgroundColor: selectedSubTags.includes(TAG_IDS["High-Protein"]) 
                                                    ? getTagStyle("High-Protein").activeBg 
                                                    : getTagStyle("High-Protein").bg,
                                                color: selectedSubTags.includes(TAG_IDS["High-Protein"]) 
                                                    ? getTagStyle("High-Protein").activeText 
                                                    : getTagStyle("High-Protein").text
                                            }}
                                        >
                                            <Tag size={18} weight="fill" className="flex-shrink-0" />
                                            <span className="flex-grow text-center">High-Protein</span>
                                        </button>
                                    </>
                                )}
                                
                                {(activeFilter !== null || selectedSubTags.length > 0) && !isSearching && (
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
                        {/* Search bar - moved inside the middle column */}
                        <div className="mb-6">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <MagnifyingGlass size={20} style={{ color: 'var(--forum-search-icon)' }} />
                                    </div>
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full p-2 pl-10 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search"
                                        placeholder="Search posts by title..."
                                        aria-label="Search posts"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        >
                                            <X size={20} style={{ color: 'var(--forum-search-icon)' }} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-5 py-3 nh-button nh-button-primary rounded-lg flex items-center"
                                >
                                    Search
                                </button>
                            </form>
                        </div>
                        
                        {/* Display search status */}
                        {isSearching && (
                            <div className="mb-6 p-3 rounded-lg border nh-forum-filter-container">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm nh-text">
                                        {searchResultsCount > 0 
                                            ? `Found ${searchResultsCount} results for "${searchQuery}"${(activeFilter || selectedSubTags.length > 0) ? ' (filtered by tags)' : ''}` 
                                            : `No results found for "${searchQuery}"`}
                                    </p>
                                    <button
                                        onClick={clearSearch}
                                        className="text-sm text-primary hover:text-primary-light flex items-center gap-1"
                                    >
                                        <X size={16} weight="bold" />
                                        Clear search
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Active filter indicator */}
                        {(filterLabel || selectedSubTagLabels.length > 0) && (
                            <div className="mb-6 p-3 rounded-lg border nh-forum-filter-container">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm nh-text">
                                        Filtered by: <span className="font-medium">
                                            {filterLabel}
                                            {filterLabel && selectedSubTagLabels.length > 0 && " + "}
                                            {selectedSubTagLabels.join(" + ")}
                                        </span>
                                    </p>
                                    <button
                                        onClick={clearFilter}
                                        className="text-sm text-primary hover:text-primary-light flex items-center gap-1"
                                    >
                                        <X size={16} weight="bold" />
                                        Clear filter
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {loading ? (
                            <div className="text-center my-12">
                                <p className="text-lg">Loading posts...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center my-12">
                                <p className="text-lg">
                                    {activeFilter !== null || selectedSubTags.length > 0
                                        ? `No posts found with the selected filter${selectedSubTags.length > 1 ? 's' : ''}. Try different combinations or create a new post.` 
                                        : `No posts found. Be the first to create a post!`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {getCurrentPosts().map((post) => (
                                    <ForumPostCard
                                        key={post.id}
                                        post={post}
                                        isLiked={likedPosts[post.id] || false}
                                        onLikeToggle={handleLikeToggle}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination - only show if we have posts and more than one page */}
                        {!loading && totalCount > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center mt-10 gap-2">
                                <button 
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer"
                                    style={{
                                        color: currentPage === 1 ? 'var(--pagination-disabled-text)' : 'var(--color-primary)',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== 1) {
                                            e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== 1) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <CaretLeft size={20} weight="bold" />
                                </button>
                                
                                {totalPages <= 5 ? (
                                    // Show all pages if 5 or fewer
                                    [...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(index + 1)}
                                            className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: currentPage === index + 1 ? 'var(--color-primary)' : 'transparent',
                                                color: currentPage === index + 1 ? 'white' : 'var(--pagination-inactive-text)',
                                                boxShadow: currentPage === index + 1 ? 'var(--shadow-sm)' : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentPage !== index + 1) {
                                                    e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentPage !== index + 1) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
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
                                            className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: currentPage === 1 ? 'var(--color-primary)' : 'transparent',
                                                color: currentPage === 1 ? 'white' : 'var(--pagination-inactive-text)',
                                                boxShadow: currentPage === 1 ? 'var(--shadow-sm)' : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentPage !== 1) {
                                                    e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentPage !== 1) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            1
                                        </button>
                                        
                                        {/* Ellipsis for many pages */}
                                        {currentPage > 3 && <span className="mx-1" style={{ color: 'var(--pagination-ellipsis-text)' }}>...</span>}
                                        
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
                                                        className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                                        style={{
                                                            backgroundColor: currentPage === pageNum ? 'var(--color-primary)' : 'transparent',
                                                            color: currentPage === pageNum ? 'white' : 'var(--pagination-inactive-text)',
                                                            boxShadow: currentPage === pageNum ? 'var(--shadow-sm)' : 'none',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (currentPage !== pageNum) {
                                                                e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (currentPage !== pageNum) {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }
                                                        }}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            }
                                        )}

                                        {/* Ellipsis for many pages */}
                                        {currentPage < totalPages - 2 && <span className="mx-1" style={{ color: 'var(--pagination-ellipsis-text)' }}>...</span>}

                                        {/* Last page */}
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: currentPage === totalPages ? 'var(--color-primary)' : 'transparent',
                                                color: currentPage === totalPages ? 'white' : 'var(--pagination-inactive-text)',
                                                boxShadow: currentPage === totalPages ? 'var(--shadow-sm)' : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentPage !== totalPages) {
                                                    e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentPage !== totalPages) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer"
                                    style={{
                                        color: currentPage === totalPages ? 'var(--pagination-disabled-text)' : 'var(--color-primary)',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== totalPages) {
                                            e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== totalPages) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
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
    );
};

export default Forum