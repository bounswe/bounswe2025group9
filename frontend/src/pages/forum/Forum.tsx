// forum page component (placeholder)
import { useState } from 'react'
import { User, ThumbsUp, ChatText, PlusCircle, CaretLeft, CaretRight, ChatDots } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

const Forum = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const postsPerPage = 5
    const totalPosts = 15 // This would come from an API in a real implementation
    const totalPages = Math.ceil(totalPosts / postsPerPage)
    const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({})
    const [likeCounts, setLikeCounts] = useState<{[key: number]: number}>(
        // Generate random initial like counts
        [...Array(totalPosts)].reduce((acc, _, index) => {
            acc[index] = Math.floor(Math.random() * 50);
            return acc;
        }, {} as {[key: number]: number})
    )
    
    // Generate random comment counts for posts
    const [commentCounts] = useState<{[key: number]: number}>(
        [...Array(totalPosts)].reduce((acc, _, index) => {
            acc[index] = Math.floor(Math.random() * 20);
            return acc;
        }, {} as {[key: number]: number})
    )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // In a real implementation, this would fetch the posts for the selected page
    }

    const handleLikeToggle = (postIndex: number) => {
        // Toggle the liked state
        const newLikedPosts = { ...likedPosts }
        newLikedPosts[postIndex] = !likedPosts[postIndex]
        setLikedPosts(newLikedPosts)
        
        // Update the like count
        const newLikeCounts = { ...likeCounts }
        newLikeCounts[postIndex] = likeCounts[postIndex] + (newLikedPosts[postIndex] ? 1 : -1)
        setLikeCounts(newLikeCounts)
        
        // In a real implementation, this would call an API to update the like status
    }

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
                <p className="nh-text text-center mb-12">
                    This is a placeholder for the Forum page.
                    Implementation will come in the next phase.
                </p>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {Array(postsPerPage).fill(null).map((_, index) => {
                        const postIndex = (currentPage - 1) * postsPerPage + index
                        if (postIndex >= totalPosts) return null
                        
                        return (
                            <div key={postIndex} className="nh-card">
                                <div className="flex items-center mb-2">
                                    <div className="mt-0.5 mr-2">
                                        <ChatText size={20} weight="fill" className="text-primary flex-shrink-0" />
                                    </div>
                                    <h3 className="nh-subtitle">Discussion Topic {postIndex + 1}</h3>
                                </div>
                                <p className="nh-text mb-4">
                                    This is a placeholder for forum post content. The actual implementation
                                    will display real posts from the community.
                                </p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <div className="mt-0.5">
                                            <User size={16} className="flex-shrink-0" />
                                        </div>
                                        Posted by: User{postIndex + 1}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <Link 
                                            to={`/forum/post/${postIndex}`}
                                            className="flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <div className="mt-0.5">
                                                <ChatDots size={16} className="flex-shrink-0" />
                                            </div>
                                            Comments: {commentCounts[postIndex] || 0}
                                        </Link>
                                        <button 
                                            onClick={() => handleLikeToggle(postIndex)}
                                            className={`flex items-center gap-1 transition-colors duration-200 hover:opacity-80 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${likedPosts[postIndex] ? 'text-primary' : ''}`}
                                        >
                                            <div className="mt-0.5">
                                                <ThumbsUp size={16} weight={likedPosts[postIndex] ? "fill" : "regular"} className="flex-shrink-0" />
                                            </div>
                                            Likes: {likeCounts[postIndex] || 0}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Pagination */}
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
            </div>
        </div>
    )
}

export default Forum