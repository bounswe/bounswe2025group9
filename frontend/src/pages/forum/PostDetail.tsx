import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, ThumbsUp, ChatText, ArrowLeft } from '@phosphor-icons/react'

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
    
    // Post state
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50))
    
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
    
    // Handle like button click
    const handleLikeToggle = () => {
        setLiked(!liked)
        setLikeCount(prev => prev + (liked ? -1 : 1))
    }
    
    // Handle comment submission
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (commentText.trim() === '') return
        
        // Add new comment to the beginning of the list
        const newComment: Comment = {
            id: comments.length,
            author: 'User1', // Current user
            content: commentText,
            timestamp: new Date()
        }
        
        setComments(prevComments => [newComment, ...prevComments])
        setCommentText('') // Clear the input
    }
    
    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

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
                        <h1 className="nh-title">Discussion Topic {postIdNum + 1}</h1>
                    </div>
                    
                    <p className="nh-text mb-6">
                        This is a placeholder for forum post content. The actual implementation
                        will display real posts from the community. This is an expanded view with
                        more details about the post and all related comments.
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                        <span className="flex items-center gap-1">
                            <div className="mt-0.5">
                                <User size={16} className="flex-shrink-0" />
                            </div>
                            Posted by: User{postIdNum + 1}
                        </span>
                        <button 
                            onClick={handleLikeToggle}
                            className={`flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${liked ? 'text-primary' : ''}`}
                        >
                            <div className="mt-0.5">
                                <ThumbsUp size={16} weight={liked ? "fill" : "regular"} className="flex-shrink-0" />
                            </div>
                            Likes: {likeCount}
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