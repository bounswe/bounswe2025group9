import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Heart, UserCircle, Sparkle, ArrowClockwise } from '@phosphor-icons/react';
import { apiClient, ForumPost } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import ForumPostCard from '../components/ForumPostCard';
import { subscribeLikeChanges } from '../lib/likeNotifications';

const LIKED_POSTS_STORAGE_KEY = 'nutriHub_likedPosts';
const FEED_NEEDS_REFRESH_KEY = 'nutriHub_feedNeedsRefresh';

const PersonalizedFeed = () => {
    const { user } = useAuth();
    const location = useLocation();
    const username = user?.username || 'anonymous';
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFollowingOnly, setShowFollowingOnly] = useState(false);
    const [followingUsernames, setFollowingUsernames] = useState<Set<string>>(new Set());
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastLocationKey = useRef<string | undefined>(undefined);

    // Helper to get liked posts from local storage
    const getUserLikedPostsFromStorage = useCallback((): {[key: number]: boolean} => {
        const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
        if (storedLikedPosts) {
            try {
                const parsedData = JSON.parse(storedLikedPosts);
                return parsedData[username] || {};
            } catch (error) {
                console.error('Error parsing liked posts from localStorage:', error);
                localStorage.removeItem(LIKED_POSTS_STORAGE_KEY);
                return {};
            }
        }
        return {};
    }, [username]);

    // Fetch liked posts from backend and sync with localStorage
    const syncLikedPostsFromBackend = useCallback(async () => {
        try {
            const response = await apiClient.getLikedPosts();
            const likedMap: { [key: number]: boolean } = {};
            (response.results || []).forEach(post => {
                likedMap[post.id] = true;
            });

            // Update localStorage with backend data
            const stored = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let allUsers: { [uname: string]: { [pid: number]: boolean } } = {};
            if (stored) {
                try { allUsers = JSON.parse(stored); } catch { allUsers = {}; }
            }
            const updatedAllUsers = { ...allUsers, [username]: likedMap };
            localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(updatedAllUsers));

            return likedMap;
        } catch (error) {
            console.error('[PersonalizedFeed] Failed to sync liked posts from backend:', error);
            return getUserLikedPostsFromStorage();
        }
    }, [username, getUserLikedPostsFromStorage]);

    // Fetch personalized feed
    const fetchFeed = useCallback(async (pageNum: number, append = false) => {
        try {
            if (!append) {
                setLoading(true);
                setPosts([]); // Clear posts immediately to prevent showing stale data
            } else {
                setLoadingMore(true);
            }

            // ALWAYS sync liked posts from backend to get the latest state
            const userLikedPosts = await syncLikedPostsFromBackend();

            // Fetch list of users we're following (only on initial load)
            if (!append && user) {
                try {
                    const followingData = await apiClient.getFollowing(username);
                    const followingList = Array.isArray(followingData) ? followingData : (followingData.following || []);
                    const followingNames = new Set(followingList.map((u: any) => u.username));
                    setFollowingUsernames(followingNames);
                } catch (error) {
                    console.error('[PersonalizedFeed] Failed to fetch following list:', error);
                }
            }

            const response = await apiClient.getPersonalizedFeed({
                page: pageNum,
                page_size: 10
            });

            const fetchedPosts = response.results.map(post => ({
                ...post,
                author: post.author || { id: 0, username: 'Anonymous' },
                liked: userLikedPosts[post.id] !== undefined ? userLikedPosts[post.id] : (post.liked || false),
            }));

            if (append) {
                setPosts(prev => [...prev, ...fetchedPosts]);
            } else {
                setPosts(fetchedPosts);
            }

            setHasMore(response.next !== null);
            setLikedPosts(userLikedPosts);
            
            // Force update posts with correct liked status after a short delay
            // This handles cases where the backend feed doesn't include liked status
            setTimeout(() => {
                setPosts(prev => prev.map(post => ({
                    ...post,
                    liked: userLikedPosts[post.id] !== undefined ? userLikedPosts[post.id] : post.liked
                })));
            }, 100);
        } catch (error) {
            console.error('Error fetching personalized feed:', error);
            setPosts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [getUserLikedPostsFromStorage, syncLikedPostsFromBackend]);

    // Initial load
    useEffect(() => {
        if (user && posts.length === 0) {
            console.log('[PersonalizedFeed] Initial load');
            fetchFeed(1, false);
        }
    }, [user, fetchFeed, posts.length]);

    // Refresh on navigation back to this page or if feed needs refresh
    useEffect(() => {
        if (!user) return;

        // Check if feed needs refresh (set by follow/unfollow actions)
        const needsRefresh = localStorage.getItem(FEED_NEEDS_REFRESH_KEY) === 'true';
        
        // Check if we're navigating back to this page (location key changed)
        const isNavigatingBack = lastLocationKey.current !== undefined && 
                                 lastLocationKey.current !== location.key;
        
        console.log('[PersonalizedFeed] Refresh check:', { needsRefresh, isNavigatingBack, locationKey: location.key });
        
        if (isNavigatingBack || needsRefresh) {
            console.log('[PersonalizedFeed] Refreshing feed due to navigation or flag');
            setPosts([]); // Clear posts to force fresh load
            setPage(1);
            fetchFeed(1, false);
            // Clear the refresh flag
            localStorage.removeItem(FEED_NEEDS_REFRESH_KEY);
        }
        
        lastLocationKey.current = location.key;
    }, [user, location.key, fetchFeed]);

    // Subscribe to cross-tab like changes
    useEffect(() => {
        const unsubscribe = subscribeLikeChanges((event) => {
            if (event.type !== 'post') return;
            
            console.log('[PersonalizedFeed] Like change detected:', event);
            
            // Update liked status in existing posts
            setLikedPosts(prev => ({ ...prev, [event.postId]: event.isLiked }));
            setPosts(prev => {
                const existingPost = prev.find(p => p.id === event.postId);
                if (existingPost) {
                    // Update existing post
                    return prev.map(p => 
                        p.id === event.postId ? { ...p, liked: event.isLiked, likes: event.likeCount } : p
                    );
                } else if (event.isLiked) {
                    // If post was just liked and not in feed, refresh the feed
                    console.log('[PersonalizedFeed] New liked post detected, refreshing feed');
                    setPage(1);
                    fetchFeed(1, false);
                    return prev;
                }
                return prev;
            });
        });

        return () => {
            unsubscribe();
        };
    }, [fetchFeed]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchFeed(nextPage, true);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loadingMore, loading, page, fetchFeed]);

    // Helper to update liked posts in storage
    const updateSinglePostLikeInStorage = (postId: number, isLiked: boolean) => {
        try {
            const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let allUsersLikedPosts: {[username: string]: {[postId: number]: boolean}} = {};
            
            if (storedLikedPosts) {
                allUsersLikedPosts = JSON.parse(storedLikedPosts);
            }
            
            const userLikedPosts = allUsersLikedPosts[username] || {};
            const updatedUserLikedPosts = {
                ...userLikedPosts,
                [postId]: isLiked
            };
            
            const updatedAllUsersLikedPosts = {
                ...allUsersLikedPosts,
                [username]: updatedUserLikedPosts
            };
            
            localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(updatedAllUsersLikedPosts));
            return updatedUserLikedPosts;
        } catch (error) {
            console.error('Error saving liked posts to localStorage:', error);
            return likedPosts;
        }
    };

    // Handle like toggle
    const handleLikeToggle = async (postId: number) => {
        try {
            const currentPost = posts.find(p => p.id === postId);
            if (!currentPost) return;

            const currentLiked = likedPosts[postId] || false;
            const newLiked = !currentLiked;
            const likeDelta = newLiked ? 1 : -1;
            const currentLikeCount = Math.max(0, currentPost.likes || 0);
            const optimisticLikeCount = Math.max(0, currentLikeCount + likeDelta);

            // Update local storage
            const updatedUserLikedPosts = updateSinglePostLikeInStorage(postId, newLiked);
            setLikedPosts(updatedUserLikedPosts);

            // Optimistic UI update
            setPosts(prev => prev.map(post => 
                post.id === postId ? { ...post, liked: newLiked, likes: optimisticLikeCount } : post
            ));

            // API call
            const response = await apiClient.toggleLikePost(postId);
            const responseObj = response as any;
            const serverLiked = responseObj.liked !== undefined ? responseObj.liked : newLiked;
            const serverLikeCount = responseObj.like_count !== undefined ? responseObj.like_count : optimisticLikeCount;

            // Update with server values
            updateSinglePostLikeInStorage(postId, serverLiked);
            setLikedPosts(prev => ({ ...prev, [postId]: serverLiked }));
            setPosts(prev => prev.map(post => 
                post.id === postId ? { ...post, liked: serverLiked, likes: serverLikeCount } : post
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            const currentPost = posts.find(p => p.id === postId);
            if (currentPost) {
                const originalLiked = !likedPosts[postId];
                updateSinglePostLikeInStorage(postId, originalLiked);
                setLikedPosts(prev => ({ ...prev, [postId]: originalLiked }));
                setPosts(prev => prev.map(post => 
                    post.id === postId ? { ...post, liked: originalLiked } : post
                ));
            }
        }
    };

    // Filter posts based on user preference
    const filteredPosts = showFollowingOnly 
        ? posts.filter(post => followingUsernames.has(post.author.username)) // Only show posts from followed users
        : posts; // Show all posts (followed + liked)

    // Check if user is following the post author or has liked the post
    const getPostBadge = (post: ForumPost) => {
        // Check if user has liked this post
        const isLiked = likedPosts[post.id] || post.liked;
        
        // Check if user is following the post author
        const isFollowingAuthor = followingUsernames.has(post.author.username);
        
        // If liked, show liked badge (takes priority)
        if (isLiked) {
            return (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    <Heart size={12} weight="fill" />
                    <span>You liked this</span>
                </div>
            );
        }
        
        // If following the author, show followed badge
        if (isFollowingAuthor) {
            return (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <UserCircle size={12} weight="fill" />
                    <span>From followed user</span>
                </div>
            );
        }
        
        // If neither liked nor following, but post is in feed, it must be liked
        // (backend bug: feed includes liked posts but doesn't set liked=true)
        return (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <Heart size={12} weight="fill" />
                <span>You liked this</span>
            </div>
        );
    };

    if (!user) {
        return (
            <div className="w-full py-16">
                <div className="nh-container text-center">
                    <h1 className="nh-title-lg mb-4">Welcome to NutriHub</h1>
                    <p className="nh-text text-xl mb-8">
                        Please log in to see your personalized feed
                    </p>
                    <Link to="/login" className="nh-button nh-button-primary">
                        Log In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left sidebar - Info */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20">
                            <div className="nh-card p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkle size={20} weight="fill" className="text-primary" />
                                    <h3 className="nh-subtitle text-sm">Your Feed</h3>
                                </div>
                                <p className="nh-text text-xs mb-3">
                                    Posts from users you follow and posts you've liked, all in one place.
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <UserCircle size={14} className="text-blue-400" />
                                        <span className="nh-text">Followed users</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Heart size={14} className="text-pink-400" />
                                        <span className="nh-text">Liked posts</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="w-full md:w-3/5">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex justify-between items-center">
                                <h2 className="nh-title">Your Personalized Feed</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setPage(1);
                                            fetchFeed(1, false);
                                        }}
                                        className="nh-button nh-button-secondary flex items-center gap-2"
                                        disabled={loading}
                                        title="Refresh feed"
                                    >
                                        <ArrowClockwise size={20} weight="bold" />
                                        Refresh
                                    </button>
                                    <Link 
                                        to="/forum/create" 
                                        className="nh-button nh-button-primary flex items-center gap-2"
                                    >
                                        <PlusCircle size={20} weight="fill" />
                                        New Post
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Filter toggle */}
                            <div className="flex items-center gap-3">
                                <span className="nh-text text-sm">Show:</span>
                                <button
                                    onClick={() => setShowFollowingOnly(false)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        !showFollowingOnly
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    All Posts
                                </button>
                                <button
                                    onClick={() => setShowFollowingOnly(true)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        showFollowingOnly
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Following Only
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-6">
                                {[...Array(5)].map((_, index) => (
                                    <div
                                        key={index}
                                        className="nh-card p-6 rounded-lg shadow-md animate-pulse"
                                    >
                                        {/* Header skeleton */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-full"
                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                ></div>
                                                <div className="space-y-2">
                                                    <div
                                                        className="h-4 w-32 rounded"
                                                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                    ></div>
                                                    <div
                                                        className="h-3 w-24 rounded"
                                                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Title skeleton */}
                                        <div
                                            className="h-6 w-3/4 rounded mb-3"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        
                                        {/* Tags skeleton */}
                                        <div className="flex gap-2 mb-4">
                                            <div
                                                className="h-6 w-20 rounded-full"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                            <div
                                                className="h-6 w-16 rounded-full"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                        </div>
                                        
                                        {/* Body skeleton */}
                                        <div className="space-y-2 mb-4">
                                            <div
                                                className="h-4 w-full rounded"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                            <div
                                                className="h-4 w-full rounded"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                            <div
                                                className="h-4 w-5/6 rounded"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                        </div>
                                        
                                        {/* Footer skeleton */}
                                        <div className="flex justify-between items-center pt-4">
                                            <div
                                                className="h-4 w-24 rounded"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                            ></div>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="h-4 w-16 rounded"
                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                ></div>
                                                <div
                                                    className="h-4 w-16 rounded"
                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="nh-card p-12 text-center">
                                <Sparkle size={48} className="mx-auto mb-4 text-gray-400" />
                                <h3 className="nh-subtitle mb-2">Your feed is empty</h3>
                                <p className="nh-text mb-6">
                                    Follow users and like posts to see them here!
                                </p>
                                <Link to="/forum" className="nh-button nh-button-primary">
                                    Explore Forum
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {filteredPosts.map(post => (
                                        <div key={post.id} className="relative">
                                            {/* Badge overlay */}
                                            <div className="absolute top-4 right-4 z-30">
                                                {getPostBadge(post)}
                                            </div>
                                            <ForumPostCard
                                                post={post}
                                                isLiked={likedPosts[post.id] || false}
                                                onLikeToggle={handleLikeToggle}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Infinite scroll trigger */}
                                {hasMore && (
                                    <div ref={observerTarget} className="py-8">
                                        {loadingMore && (
                                            <div className="space-y-6">
                                                {[...Array(3)].map((_, index) => (
                                                    <div
                                                        key={`loading-more-${index}`}
                                                        className="nh-card p-6 rounded-lg shadow-md animate-pulse"
                                                    >
                                                        {/* Header skeleton */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-12 h-12 rounded-full"
                                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                                ></div>
                                                                <div className="space-y-2">
                                                                    <div
                                                                        className="h-4 w-32 rounded"
                                                                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                                    ></div>
                                                                    <div
                                                                        className="h-3 w-24 rounded"
                                                                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Title skeleton */}
                                                        <div
                                                            className="h-6 w-3/4 rounded mb-3"
                                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                        ></div>
                                                        
                                                        {/* Tags skeleton */}
                                                        <div className="flex gap-2 mb-4">
                                                            <div
                                                                className="h-6 w-20 rounded-full"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                            <div
                                                                className="h-6 w-16 rounded-full"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                        </div>
                                                        
                                                        {/* Body skeleton */}
                                                        <div className="space-y-2 mb-4">
                                                            <div
                                                                className="h-4 w-full rounded"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                            <div
                                                                className="h-4 w-full rounded"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                            <div
                                                                className="h-4 w-5/6 rounded"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                        </div>
                                                        
                                                        {/* Footer skeleton */}
                                                        <div className="flex justify-between items-center pt-4">
                                                            <div
                                                                className="h-4 w-24 rounded"
                                                                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                            ></div>
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    className="h-4 w-16 rounded"
                                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                                ></div>
                                                                <div
                                                                    className="h-4 w-16 rounded"
                                                                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!hasMore && filteredPosts.length > 0 && (
                                    <div className="py-8 text-center">
                                        <p className="nh-text text-gray-500">You've reached the end of your feed</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right sidebar - Quick actions */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20 space-y-4">
                            <Link to="/forum" className="nh-button nh-button-secondary w-full">
                                Browse All Posts
                            </Link>
                            <Link to="/foods" className="nh-button nh-button-secondary w-full">
                                Explore Foods
                            </Link>
                            <Link to="/mealplanner" className="nh-button nh-button-secondary w-full">
                                Meal Planner
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizedFeed;
