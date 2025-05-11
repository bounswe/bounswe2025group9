// forum page component
import { useState, useEffect } from 'react'
import { User, ThumbsUp, ChatText, PlusCircle, CaretLeft, CaretRight, ChatDots } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { apiClient } from '../../lib/apiClient'

interface APIPost {
    id: number;
    title: string;
    content: string;
    author: string;
    likes: number;
    date: string;
    type?: 'recipe' | 'nutrition_tip';
}

const Forum = () => {
    const location = useLocation();
    const [posts, setPosts] = useState<APIPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
    
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
    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getPosts();
            
            // Create a new likedPosts state based on sessionStorage
            const newLikedPosts: {[key: number]: boolean} = {};
            
            // Check sessionStorage for any likes that were set in PostDetail or previously in Forum
            const updatedPosts = data.map(post => {
                const storedLikes = sessionStorage.getItem(`post_${post.id}_likes`);
                const storedLiked = sessionStorage.getItem(`post_${post.id}_liked`);
                
                // If we have stored like information, update the post
                if (storedLikes) {
                    post.likes = parseInt(storedLikes);
                }
                
                // Update the liked state
                if (storedLiked) {
                    newLikedPosts[post.id] = storedLiked === 'true';
                }
                
                return post;
            });
            
            // Sort posts by date in descending order (newest first)
            const sortedPosts = updatedPosts.sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            // Update state
            setPosts(sortedPosts);
            setLikedPosts(newLikedPosts);
            
            // Reset to first page when posts are refreshed
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
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
            // Update the posts with new like count
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    const newLikeCount = post.likes + (newLiked ? 1 : -1);
                    
                    // Store the updated like state and count in sessionStorage immediately
                    sessionStorage.setItem(`post_${postId}_liked`, String(newLiked));
                    sessionStorage.setItem(`post_${postId}_likes`, String(newLikeCount));
                    
                    return {
                        ...post,
                        likes: newLikeCount
                    };
                }
                return post;
            }));
            
            // Call the API to like/unlike the post
            if (newLiked) {
                await apiClient.likeItem(postId, "post");
            } else {
                // In a real implementation, there would be an unlike API
                // This is a mock for demonstration purposes
                console.log('Unlike post:', postId);
                // await apiClient.unlikeItem(postId, "post");
            }
        } catch (error) {
            console.error('Error toggling post like:', error);
            
            // Revert UI change if API call fails
            setLikedPosts(prev => ({
                ...prev,
                [postId]: isCurrentlyLiked
            }));
            
            // Also revert the like count and sessionStorage
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    const originalLikeCount = post.likes + (isCurrentlyLiked ? 0 : newLiked ? -1 : 1);
                    
                    // Update sessionStorage
                    sessionStorage.setItem(`post_${postId}_liked`, String(isCurrentlyLiked));
                    sessionStorage.setItem(`post_${postId}_likes`, String(originalLikeCount));
                    
                    return {
                        ...post,
                        likes: originalLikeCount
                    };
                }
                return post;
            }));
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
                const storedLikes = sessionStorage.getItem(`post_${post.id}_likes`);
                
                if (storedLiked !== null) {
                    const isLiked = storedLiked === 'true';
                    if (updatedLikedPosts[post.id] !== isLiked) {
                        updatedLikedPosts[post.id] = isLiked;
                        needsUpdate = true;
                    }
                }
                
                if (storedLikes !== null) {
                    const likeCount = parseInt(storedLikes);
                    if (post.likes !== likeCount) {
                        post.likes = likeCount;
                        needsUpdate = true;
                    }
                }
            });
            
            if (needsUpdate) {
                setLikedPosts({ ...updatedLikedPosts });
                setPosts([...posts]);
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
                <div className="flex justify-between items-center mb-8 relative">
                    <div className="w-full text-center">
                        <h1 className="nh-title">Community Forum</h1>
                    </div>
                    <Link to="/forum/create" className="nh-button nh-button-primary flex items-center gap-2 absolute right-0">
                        <PlusCircle size={20} weight="fill" />
                        New Post
                    </Link>
                </div>
                
                {loading ? (
                    <div className="text-center my-12">
                        <p className="text-lg">Loading posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center my-12">
                        <p className="text-lg">No posts found. Be the first to create a post!</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {getCurrentPosts().map((post) => (
                            <div key={post.id} className="nh-card">
                                <div className="flex items-center mb-2">
                                    <div className="mt-0.5 mr-2">
                                        <ChatText size={20} weight="fill" className="text-primary flex-shrink-0" />
                                    </div>
                                    <h3 className="nh-subtitle">{post.title}</h3>
                                </div>
                                <p className="nh-text mb-4">
                                    {post.content.length > 150 
                                        ? post.content.substring(0, 150) + '...' 
                                        : post.content}
                                </p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <div className="mt-0.5">
                                            <User size={16} className="flex-shrink-0" />
                                        </div>
                                        Posted by: {post.author} • {formatDate(post.date)}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <Link 
                                            to={`/forum/post/${post.id}`}
                                            className="flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <div className="mt-0.5">
                                                <ChatDots size={16} className="flex-shrink-0" />
                                            </div>
                                            Comments
                                        </Link>
                                        <button 
                                            onClick={() => handleLikeToggle(post.id)}
                                            className={`flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${likedPosts[post.id] ? 'text-primary' : ''}`}
                                        >
                                            <div className="mt-0.5">
                                                <ThumbsUp size={16} weight={likedPosts[post.id] ? "fill" : "regular"} className="flex-shrink-0" />
                                            </div>
                                            Likes: {post.likes || 0}
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
