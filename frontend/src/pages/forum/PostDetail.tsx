import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { User, ThumbsUp, ChatText, ArrowLeft, Tag, ChatDots, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { apiClient, ForumPost, ForumTag, PaginatedResponse, ForumComment } from '../../lib/apiClient'

// local storage key for liked posts - use the same key as Forum component
const LIKED_POSTS_STORAGE_KEY = 'nutriHub_likedPosts';

// Post interface for the data from API
interface APIPost {
    id: number;
    title: string;
    content: string;
    author: string;
    likes: number;
    date: string;
    tags: ForumTag[];
    liked?: boolean;
}

// Comment type definition
interface Comment {
    id: number;
    post: number;
    author: string;
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
    
    // Post state
    const [post, setPost] = useState<APIPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [liked, setLiked] = useState(false)
    
    // Comment state
    const [commentText, setCommentText] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentPage, setCommentPage] = useState(1)
    const [totalComments, setTotalComments] = useState(0)
    const commentsPerPage = 10 // Default comments per page

    // Calculate total pages for comments
    const totalCommentPages = Math.ceil(totalComments / commentsPerPage)

    // Load liked posts from local storage on component mount
    useEffect(() => {
        const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
        if (storedLikedPosts && postIdNum) {
            try {
                const parsedLikedPosts = JSON.parse(storedLikedPosts);
                // Set initial liked state from local storage if available
                if (parsedLikedPosts[postIdNum] !== undefined) {
                    setLiked(parsedLikedPosts[postIdNum]);
                }
            } catch (error) {
                console.error('Error parsing liked posts from localStorage:', error);
            }
        }
    }, [postIdNum]);
    
    // Helper function to update local storage
    const updateLikedPostsStorage = (postId: number, isLiked: boolean) => {
        try {
            const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
            let likedPosts = {};
            
            if (storedLikedPosts) {
                likedPosts = JSON.parse(storedLikedPosts) as {[key: number]: boolean};
            }
            
            // Update the liked status for this post
            likedPosts = {
                ...likedPosts,
                [postId]: isLiked
            };
            
            // Save to local storage
            localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPosts));
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
                    author: typeof comment.author === 'string' 
                        ? comment.author 
                        : comment.author.username,
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

        console.log(`[PostDetail] Fetching post with ID: ${postIdNum}`);
        setLoading(true);
        try {
            // Get post details using the new endpoint
            const postData = await apiClient.getPostDetail(postIdNum);
            
            if (postData) {
                console.log('[PostDetail] Received post data:', postData);
                // Transform API response format to match our component's format
                const transformedPost: APIPost = {
                    id: postData.id,
                    title: postData.title,
                    content: postData.body, // API returns 'body' instead of 'content'
                    author: postData.author.username,
                    likes: (postData as any).like_count || postData.likes || 0, // Prefer like_count if available
                    date: postData.created_at,
                    tags: postData.tags, // Include tags from the API response
                    liked: postData.liked || false
                };
                
                console.log('[PostDetail] Transformed post data:', transformedPost);
                
                // Check local storage for liked status
                const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
                if (storedLikedPosts) {
                    try {
                        const parsedLikedPosts = JSON.parse(storedLikedPosts) as {[key: number]: boolean};
                        // If we have this post in local storage, use that value
                        if (parsedLikedPosts[postIdNum] !== undefined) {
                            const localLiked = parsedLikedPosts[postIdNum];
                            const serverLiked = postData.liked || false;
                            
                            // Important: Only adjust likes count if API hasn't processed our like yet.
                            // This prevents double-counting when moving between Forum and PostDetail.
                            // Forum component already updated the backend, so API should reflect the correct count.
                            // We do NOT need to manually adjust the count in most cases.
                            
                            // Always trust local storage for liked state
                            transformedPost.liked = localLiked;
                            setLiked(localLiked);
                        } else {
                            // No local storage entry for this post, create one
                            setLiked(transformedPost.liked || false);
                            updateLikedPostsStorage(postIdNum, transformedPost.liked || false);
                        }
                    } catch (error) {
                        console.error('Error parsing liked posts from localStorage:', error);
                        setLiked(transformedPost.liked || false);
                        updateLikedPostsStorage(postIdNum, transformedPost.liked || false);
                    }
                } else {
                    // No local storage data, use API response
                    setLiked(transformedPost.liked || false);
                    updateLikedPostsStorage(postIdNum, transformedPost.liked || false);
                }
                
                setPost(transformedPost);
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
            console.log(`[PostDetail] Toggling like for post ID: ${post.id}`);
            
            // Optimistic update for better UX
            const newLikedState = !liked;
            const newLikeCount = post.likes + (newLikedState ? 1 : -1);
            
            // Update state immediately for responsive UI
            setLiked(newLikedState);
            setPost({
                ...post,
                liked: newLikedState,
                likes: newLikeCount
            });
            
            // Update local storage
            updateLikedPostsStorage(post.id, newLikedState);
            
            // Call API to toggle like status
            const response = await apiClient.toggleLikePost(post.id);
            console.log(`[PostDetail] Toggle like response:`, response);
            
            // If the server response doesn't match our optimistic update, correct it
            const responseObj = response as any;
            if (responseObj.liked !== undefined && responseObj.liked !== newLikedState) {
                console.warn(`[PostDetail] Server liked state (${responseObj.liked}) differs from local state (${newLikedState})`);
                // Trust local storage over server for consistency with Forum.tsx
                // We already updated local storage above
            }
            
            // If the server provides a like count directly, we could use it here
            // But for consistency with our local state management, we'll stick with our calculated count
            
        } catch (error) {
            console.error('[PostDetail] Error toggling post like:', error);
            // On error, revert to previous state
            if (post) {
                const revertLikedState = !liked;
                const revertLikeCount = post.likes + (revertLikedState ? 1 : -1);
                
                setLiked(revertLikedState);
                setPost({
                    ...post,
                    liked: revertLikedState,
                    likes: revertLikeCount
                });
                
                // Revert local storage too
                updateLikedPostsStorage(post.id, revertLikedState);
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
                author: typeof newComment.author === 'string'
                    ? newComment.author
                    : newComment.author.username,
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
                <div className="mb-6">
                    <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6 py-3 rounded-lg shadow-sm hover:shadow transition-all px-4">
                        <ArrowLeft size={20} weight="bold" />
                        Back to Forum
                    </Link>
                </div>
                
                {/* Post */}
                <div className="nh-card mb-8 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <div className="flex items-center justify-center mr-3">
                            <ChatText size={24} weight="fill" className="text-primary" />
                        </div>
                        <h1 className="nh-title">{post.title}</h1>
                    </div>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
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
                    
                    <p className="nh-text mb-6">
                        {post.content}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                        <span className="flex items-center gap-1">
                            <div className="flex items-center justify-center">
                                <User size={16} className="flex-shrink-0" />
                            </div>
                            Posted by: {post.author} • {formatDate(post.date)}
                        </span>
                        <button 
                            onClick={handleLikeToggle}
                            className={`flex items-center gap-1 transition-colors duration-200 rounded-md px-3 py-1.5 hover:bg-gray-700 ${liked ? 'text-primary' : ''}`}
                        >
                            <div className="flex items-center justify-center">
                                <ThumbsUp size={16} weight={liked ? "fill" : "regular"} className="flex-shrink-0" />
                            </div>
                            Likes: {post.likes}
                        </button>
                    </div>
                </div>
                
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
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <User size={18} weight="fill" className="text-gray-500" />
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-primary">
                                                    {comment.author}
                                                </h4>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${commentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
                            >
                                <CaretLeft size={20} weight="bold" />
                            </button>
                            
                            {totalCommentPages <= 5 ? (
                                // Show all pages if 5 or fewer
                                [...Array(totalCommentPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleCommentPageChange(index + 1)}
                                        className={`w-10 h-10 rounded-full transition-all ${
                                            commentPage === index + 1 
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
                                        onClick={() => handleCommentPageChange(1)}
                                        className={`w-10 h-10 rounded-full transition-all ${
                                            commentPage === 1 
                                            ? 'bg-primary text-white shadow' 
                                            : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                        }`}
                                    >
                                        1
                                    </button>
                                    
                                    {/* Ellipsis for many pages */}
                                    {commentPage > 3 && <span className="mx-1">...</span>}
                                    
                                    {/* Pages around current page */}
                                    {Array.from(
                                        { length: Math.min(3, totalCommentPages - 2) },
                                        (_, i) => {
                                            let pageNum;
                                            if (commentPage <= 2) {
                                                pageNum = i + 2; // Show 2, 3, 4
                                            } else if (commentPage >= totalCommentPages - 1) {
                                                pageNum = totalCommentPages - 3 + i; // Show last 3 pages before the last
                                            } else {
                                                pageNum = commentPage - 1 + i; // Show around current
                                            }
                                            
                                            if (pageNum <= 1 || pageNum >= totalCommentPages) return null;
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handleCommentPageChange(pageNum)}
                                                    className={`w-10 h-10 rounded-full transition-all ${
                                                        commentPage === pageNum 
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
                                    {commentPage < totalCommentPages - 2 && <span className="mx-1">...</span>}
                                    
                                    {/* Last page */}
                                    <button
                                        onClick={() => handleCommentPageChange(totalCommentPages)}
                                        className={`w-10 h-10 rounded-full transition-all ${
                                            commentPage === totalCommentPages 
                                            ? 'bg-primary text-white shadow' 
                                            : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                        }`}
                                    >
                                        {totalCommentPages}
                                    </button>
                                </>
                            )}
                            
                            <button 
                                onClick={() => handleCommentPageChange(Math.min(totalCommentPages, commentPage + 1))}
                                disabled={commentPage === totalCommentPages}
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${commentPage === totalCommentPages ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
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
                                        className="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                                    className="nh-button nh-button-primary py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                >
                                    <ChatDots size={18} weight="fill" />
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostDetail 