import { useState, useEffect, useRef } from 'react'
import { ThumbsUp, ChatDots, Tag } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { ForumPost } from '../lib/apiClient'
import ProfileImage from './ProfileImage'

// Define tag colors based on tag name for consistent display
const getTagStyle = (tagName: string) => {
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

interface ForumPostCardProps {
    post: ForumPost
    isLiked: boolean
    onLikeToggle: (postId: number) => void
}

const ForumPostCard = ({ post, isLiked, onLikeToggle }: ForumPostCardProps) => {
    const [prevLikes, setPrevLikes] = useState(post.likes || 0)
    const [showAnimation, setShowAnimation] = useState(false)
    const [likeDiff, setLikeDiff] = useState(0)
    const timeoutRef = useRef<number | null>(null)

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Track like count changes and trigger animation
    useEffect(() => {
        const currentLikes = post.likes || 0
        
        if (currentLikes > prevLikes) {
            const diff = currentLikes - prevLikes
            setLikeDiff(diff)
            setShowAnimation(true)
            
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            
            // Hide animation after 1.5 seconds
            timeoutRef.current = setTimeout(() => {
                setShowAnimation(false)
            }, 1500)
        }
        
        setPrevLikes(currentLikes)
        
        // Cleanup timeout on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [post.likes])

    return (
        <div key={post.id} className="nh-card relative">
            {/* Add clickable overlay that links to post detail */}
            <Link 
                to={`/forum/post/${post.id}`}
                className="absolute inset-0 z-10"
                aria-label={`View post: ${post.title}`}
            />
            
            <div className="flex items-center mb-2">
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
                <span className="flex items-center gap-2">
                    <ProfileImage 
                        profileImage={post.author.profile_image}
                        username={post.author.username}
                        size="sm"
                    />
                    <div className="flex items-center gap-1">
                        {post.author.username} • {formatDate(post.created_at)}
                    </div>
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
                            onLikeToggle(post.id);
                        }}
                        className={`flex items-center gap-1 transition-colors duration-200 rounded-md px-3 py-1.5 hover:bg-gray-700 ${isLiked ? 'text-primary' : ''} relative z-20`}
                    >
                        <div className="flex items-center justify-center">
                            <ThumbsUp size={16} weight={isLiked ? "fill" : "regular"} className="flex-shrink-0" />
                        </div>
                        Likes: <span 
                            className={showAnimation && likeDiff > 0 ? 'like-count-pulse' : ''}
                            style={showAnimation && likeDiff > 0 ? {
                                animation: 'likeCountPulse 0.6s ease-out'
                            } : {}}
                        >
                            {post.likes || 0}
                        </span>
                    </button>
                </div>
            </div>
            
            {/* Add animation keyframes */}
            <style>{`
                @keyframes likeCountPulse {
                    0% {
                        transform: scale(1);
                    }
                    25% {
                        transform: scale(1.3);
                        color: var(--color-primary);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    75% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default ForumPostCard;

