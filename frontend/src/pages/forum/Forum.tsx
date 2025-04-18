import { User, ThumbsUp, ChatText } from '@phosphor-icons/react'

// forum page component (placeholder)
const Forum = () => {
    return (
        <div className="py-12">
            <div className="nh-container">
                <h1 className="nh-title text-center mb-4">Community Forum</h1>
                <p className="nh-text text-center mb-12">
                    This is a placeholder for the Forum page.
                    Implementation will come in the next phase.
                </p>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {Array(5).fill(null).map((_, index) => (
                        <div key={index} className="nh-card">
                            <div className="flex items-center mb-2">
                                <div className="mt-0.5 mr-2">
                                    <ChatText size={20} weight="fill" className="text-primary flex-shrink-0" />
                                </div>
                                <h3 className="nh-subtitle">Discussion Topic {index + 1}</h3>
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
                                    Posted by: User{index + 1}
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="mt-0.5">
                                        <ThumbsUp size={16} className="flex-shrink-0" />
                                    </div>
                                    Likes: {Math.floor(Math.random() * 50)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Forum 