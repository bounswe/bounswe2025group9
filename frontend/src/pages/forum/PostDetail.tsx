import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { User, ThumbsUp, ChatText, ArrowLeft, Tag, ChatDots } from '@phosphor-icons/react'
import { apiClient, ForumPost, ForumTag } from '../../lib/apiClient'

// Post interface for the data from API
interface APIPost {
    id: number;
    title: string;
    content: string;
    author: string;
    likes: number;
    date: string;
    tags: ForumTag[];
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
            return { bg: '#e6f7f2', text: '#0d7c5f' }; // Green
        case "Recipe":
            return { bg: '#f0e6ff', text: '#6200ee' }; // Purple
        case "Meal plan":
            return { bg: '#e6f0ff', text: '#0062cc' }; // Blue
        default:
            return { bg: '#f2f2f2', text: '#666666' }; // Grey (fallback)
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
    // Track original likes to maintain consistency
    const [originalLikes, setOriginalLikes] = useState<number>(0)
    
    // Comment state
    const [commentText, setCommentText] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)

    // Function to sync with sessionStorage
    const syncWithStorage = useCallback(() => {
        if (!post) return;
        
        // Store the updated like state in sessionStorage to keep Forum in sync
        sessionStorage.setItem(`post_${post.id}_liked`, liked ? 'true' : 'false');
        sessionStorage.setItem(`post_${post.id}_likes`, String(post.likes));
    }, [post, liked]);

    // Fetch specific post when component mounts
    useEffect(() => {
        fetchPost();
    }, [postId]);
    
    // Fetch comments when we have a valid post
    useEffect(() => {
        if (post) {
            fetchComments();
        }
    }, [post]);
    
    // Fetch comments for the current post
    const fetchComments = async () => {
        if (!postId || isNaN(postIdNum)) return;
        
        setLoadingComments(true);
        try {
            const commentsData = await apiClient.getPostComments(postIdNum);
            if (commentsData) {
                // Transform API comments to match our interface if needed
                const transformedComments = commentsData.map(comment => ({
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

    // Fetch post data from API
    const fetchPost = async () => {
        if (!postId || isNaN(postIdNum)) {
            navigate('/forum');
            return;
        }

        setLoading(true);
        try {
            // Get post details using the new endpoint
            const postData = await apiClient.getPostDetail(postIdNum);
            
            if (postData) {
                // Transform API response format to match our component's format
                const transformedPost: APIPost = {
                    id: postData.id,
                    title: postData.title,
                    content: postData.body, // API returns 'body' instead of 'content'
                    author: postData.author.username,
                    likes: 0, // We'll get likes separately if needed
                    date: postData.created_at,
                    tags: postData.tags // Include tags from the API response
                };
                
                setPost(transformedPost);
                
                // Store the original likes count for reference
                setOriginalLikes(0); // Set to 0 until we implement likes fetching
                
                // Check if this post was previously liked from sessionStorage
                const storedLiked = sessionStorage.getItem(`post_${postIdNum}_liked`);
                
                // If we have previously stored like state, use it
                if (storedLiked !== null) {
                    setLiked(storedLiked === 'true');
                } else {
                    // Reset the liked state if no previous state found
                    setLiked(false);
                }
            } else {
                // Post not found, redirect to forum
                navigate('/forum');
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            // On error, redirect to forum
            navigate('/forum');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle like button click
    const handleLikeToggle = async () => {
        if (!post) return;
        
        // Update UI optimistically
        const newLiked = !liked;
        setLiked(newLiked);
        
        // Calculate new like count
        const likeDelta = newLiked ? 1 : -1;
        const newLikeCount = post.likes + likeDelta;
        
        // Update post with new like count
        setPost({ ...post, likes: newLikeCount });
        
        try {
            // Call API to update like status
            if (newLiked) {
                await apiClient.likeItem(post.id, "post");
            } else {
                // In a real implementation, there would be an unlike API
                // This is a mock for demonstration purposes
                console.log('Unlike post:', post.id);
                // await apiClient.unlikeItem(post.id, "post");
            }
            
            // Store the updated likes as the new "original" value
            setOriginalLikes(newLikeCount);
            
            // Update sessionStorage immediately to keep state in sync
            syncWithStorage();
        } catch (error) {
            console.error('Error toggling post like:', error);
            // Revert UI changes on error
            setLiked(!newLiked);
            const revertedLikeCount = post.likes - likeDelta;
            setPost({ ...post, likes: revertedLikeCount });
            
            // Also revert in session storage
            if (post) {
                sessionStorage.setItem(`post_${post.id}_liked`, !newLiked ? 'true' : 'false');
                sessionStorage.setItem(`post_${post.id}_likes`, String(revertedLikeCount));
            }
        }
    }
    
    // Store like state in sessionStorage when navigating away or when state changes
    useEffect(() => {
        syncWithStorage();
    }, [post, liked, syncWithStorage]);
    
    // Make sure to sync on unmount as well to ensure Forum gets latest state
    useEffect(() => {
        return () => {
            if (post) {
                sessionStorage.setItem(`post_${post.id}_liked`, liked ? 'true' : 'false');
                sessionStorage.setItem(`post_${post.id}_likes`, String(post.likes));
            }
        };
    }, [post, liked]);
    
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
            
            // Add new comment to the list
            setComments(prevComments => [transformedComment, ...prevComments])
            setCommentText('') // Clear the input
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Failed to post your comment. Please try again.');
        }
    }
    
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