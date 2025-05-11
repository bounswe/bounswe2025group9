import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { User, ThumbsUp, ChatText, ArrowLeft } from '@phosphor-icons/react'
import { apiClient } from '../../lib/apiClient'

// Post interface for the data from API
interface APIPost {
    id: number;
    title: string;
    content: string;
    author: string;
    likes: number;
    date: string;
}

// Comment type definition
interface Comment {
    id: number;
    author: string;
    content: string;
    timestamp: Date;
}

const PostDetail = () => {
    const { postId } = useParams<{ postId: string }>()
    const postIdNum = parseInt(postId || '0')
    const navigate = useNavigate()
    
    // Post state
    const [post, setPost] = useState<APIPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [liked, setLiked] = useState(false)
    // Track original likes to maintain consistency
    const [, setOriginalLikes] = useState<number>(0)
    
    // Comment state
    const [commentText, setCommentText] = useState('')
    const [comments, setComments] = useState<Comment[]>(() => {
        // Generate initial placeholder comments
        const commentCount = Math.floor(Math.random() * 12) + 3
        return Array(commentCount).fill(null).map((_, index) => ({
            id: index,
            author: `Commenter${index + 1}`,
            content: 'This is a placeholder for comment content. The actual implementation will display real comments from the community.',
            timestamp: new Date(Date.now() - Math.random() * 10000000000)
        }))
    })

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

    // Fetch post data from API
    const fetchPost = async () => {
        if (!postId || isNaN(postIdNum)) {
            navigate('/forum');
            return;
        }

        setLoading(true);
        try {
            const allPosts = await apiClient.getPosts();
            const foundPost = allPosts.find(p => p.id === postIdNum);
            
            if (foundPost) {
                setPost(foundPost);
                
                // Store the original likes count for reference
                setOriginalLikes(foundPost.likes);
                
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
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (commentText.trim() === '') return
        
        // Add new comment to the beginning of the list
        const newComment: Comment = {
            id: comments.length,
            author: 'You', // Current user
            content: commentText,
            timestamp: new Date()
        }
        
        setComments(prevComments => [newComment, ...prevComments])
        setCommentText('') // Clear the input
        
        // In a real implementation, this would call an API to save the comment
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
            <div className="py-12">
                <div className="nh-container">
                    <div className="mb-6">
                        <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6">
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
            <div className="py-12">
                <div className="nh-container">
                    <div className="mb-6">
                        <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6">
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
        <div className="py-12">
            <div className="nh-container">
                <div className="mb-6">
                    <Link to="/forum" className="nh-button nh-button-outline flex items-center gap-2 mb-6">
                        <ArrowLeft size={20} weight="bold" />
                        Back to Forum
                    </Link>
                </div>
                
                {/* Post */}
                <div className="nh-card mb-8">
                    <div className="flex items-center mb-4">
                        <div className="mt-0.5 mr-2">
                            <ChatText size={24} weight="fill" className="text-primary flex-shrink-0" />
                        </div>
                        <h1 className="nh-title">{post.title}</h1>
                    </div>
                    
                    <p className="nh-text mb-6">
                        {post.content}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                        <span className="flex items-center gap-1">
                            <div className="mt-0.5">
                                <User size={16} className="flex-shrink-0" />
                            </div>
                            Posted by: {post.author} • {formatDate(post.date)}
                        </span>
                        <button 
                            onClick={handleLikeToggle}
                            className={`flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${liked ? 'text-primary' : ''}`}
                        >
                            <div className="mt-0.5">
                                <ThumbsUp size={16} weight={liked ? "fill" : "regular"} className="flex-shrink-0" />
                            </div>
                            Likes: {post.likes}
                        </button>
                    </div>
                </div>
                
                {/* Comments Section */}
                <div className="mb-6">
                    <h2 className="nh-subtitle mb-4">Comments ({comments.length})</h2>
                    {/* Add Comment Form */}
                    <div className="nh-card border border-gray-200 dark:border-gray-700 mb-6">
                        <h3 className="nh-subtitle mb-2">Add a Comment</h3>
                        <form onSubmit={handleCommentSubmit}>
                            <div className="mb-4">
                                <textarea 
                                    className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700"
                                    rows={3}
                                    placeholder="Enter your comment here..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                className="nh-button nh-button-primary dark:bg-primary dark:text-white light:bg-[#0d7c5f] light:text-white"
                            >
                                Submit Comment
                            </button>
                        </form>
                    </div>
                    
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="nh-card border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User size={16} className="text-gray-500" />
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-medium">{comment.author}</p>
                                            <span className="text-xs text-gray-500">
                                                {comment.timestamp.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="nh-text text-sm">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostDetail 
