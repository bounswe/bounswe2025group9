import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Tag, WarningCircle } from '@phosphor-icons/react'
import { apiClient, ForumTag, CreateForumPostRequest } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'

// Required tag IDs (Dietary tip or Recipe)
const REQUIRED_TAG_IDS = [1, 2];
const TAG_NAMES = {
  1: "Dietary tip",
  2: "Recipe"
};

// Only these tags are allowed to be selected
const ALLOWED_TAG_IDS = [1, 2];

const CreatePost = () => {
    const navigate = useNavigate();
    const { isAuthenticated, getAccessToken, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<ForumTag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([1]); // Default to Dietary tip
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Check authentication status when component mounts
    useEffect(() => {
        console.log('Auth status in CreatePost:', {
            isAuthenticated,
            accessToken: getAccessToken() ? 'Token exists' : 'No token',
            user
        });
    }, [isAuthenticated, user]);
    
    // Fetch tags when component mounts
    useEffect(() => {
        fetchTags();
    }, []);
    
    // Fetch available tags from API
    const fetchTags = async () => {
        setLoading(true);
        try {
            // Log authentication status before making the API call
            console.log('Before fetching tags - Auth status:', {
                isAuthenticated,
                tokenExists: !!getAccessToken()
            });
            
            const data = await apiClient.getForumTags();
            console.log('Tags response:', data);
            
            // Check if data is an array
            if (Array.isArray(data)) {
                setTags(data);
            } else if (data && typeof data === 'object') {
                // Check if tags might be in a results property (common pagination pattern)
                const responseObj = data as { results?: ForumTag[] };
                if (Array.isArray(responseObj.results)) {
                    setTags(responseObj.results);
                } else {
                    console.error('Tags data is not in expected format:', data);
                    setTags([]);
                }
            } else {
                console.error('Unexpected tags response format:', data);
                setTags([]);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Toggle tag selection with validation
    const toggleTag = (tagId: number) => {
        // Don't allow toggling tags that aren't in the allowed list
        if (!ALLOWED_TAG_IDS.includes(tagId)) {
            return;
        }
        
        setSelectedTagIds(prevSelectedTags => {
            let newSelectedTags: number[];
            
            if (prevSelectedTags.includes(tagId)) {
                // User is trying to deselect a tag
                newSelectedTags = prevSelectedTags.filter(id => id !== tagId);
                
                // Check if we're removing the last required tag
                const hasRequiredTag = newSelectedTags.some(id => REQUIRED_TAG_IDS.includes(id));
                if (!hasRequiredTag) {
                    // Don't allow removing if it's the last required tag
                    setValidationError(`At least one of "${TAG_NAMES[1]}" or "${TAG_NAMES[2]}" is required.`);
                    return prevSelectedTags; // Return original tags, preventing removal
                }
            } else {
                // User is adding a tag - just add it
                newSelectedTags = [...prevSelectedTags, tagId];
            }
            
            // Clear validation error if there's at least one required tag
            const hasRequiredTag = newSelectedTags.some(id => REQUIRED_TAG_IDS.includes(id));
            if (hasRequiredTag) {
                setValidationError('');
            }
            
            return newSelectedTags;
        });
    };
    
    // Check if a required tag was selected
    const hasRequiredTag = selectedTagIds.some(id => REQUIRED_TAG_IDS.includes(id));
    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated || !getAccessToken()) {
            console.error('User is not authenticated. Cannot submit post.');
            alert('You must be logged in to create a post. Please log in and try again.');
            navigate('/login');
            return;
        }
        
        if (title.trim() === '' || content.trim() === '') {
            setValidationError('Please fill in all required fields');
            return;
        }
        
        // Make sure at least one required tag is selected
        if (!hasRequiredTag) {
            setValidationError(`At least one of "${TAG_NAMES[1]}" or "${TAG_NAMES[2]}" is required.`);
            return;
        }
        
        setSubmitting(true);
        setValidationError('');
        
        try {
            // Log authentication status before submission
            console.log('Before post submission - Auth status:', {
                isAuthenticated,
                tokenExists: !!getAccessToken(),
                tokenFirstChars: getAccessToken()?.substring(0, 10)
            });
            
            // Create post data according to the API spec
            const postData: CreateForumPostRequest = {
                title,
                body: content,
                tag_ids: selectedTagIds // Always include tag_ids
            };
            
            console.log('Submitting post with data:', postData);
            
            // Use the apiClient to create the post
            const response = await apiClient.createForumPost(postData);
            console.log('Post created:', response);
            
            // Show success message
            setSuccessMessage('Post created successfully! Redirecting to forum...');
            
            // Force refresh forum posts by navigating with a state parameter
            setTimeout(() => {
                navigate('/forum', { state: { refreshPosts: true } });
            }, 2000);
        } catch (error) {
            console.error('Error creating post:', error);
            setValidationError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // If not authenticated, show login message
    if (!isAuthenticated) {
        return (
            <div className="py-12">
                <div className="nh-container">
                    <div className="nh-card mb-8">
                        <h1 className="nh-title mb-6">Authentication Required</h1>
                        <p className="mb-4">You need to be logged in to create a post.</p>
                        <div className="flex gap-4">
                            <Link to="/login" className="nh-button nh-button-primary">
                                Log In
                            </Link>
                            <Link to="/forum" className="nh-button nh-button-outline">
                                Back to Forum
                            </Link>
                        </div>
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
                
                <div className="nh-card mb-8">
                    <h1 className="nh-title mb-6">Create New Post</h1>
                    
                    {user && (
                        <p className="mb-4 text-sm">
                            Posting as: <span className="font-semibold">{user.username}</span>
                        </p>
                    )}
                    
                    {/* Display success message if present */}
                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-md mb-6 flex items-start gap-2">
                            <span>{successMessage}</span>
                        </div>
                    )}
                    
                    {/* Display validation error if present */}
                    {validationError && (
                        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6 flex items-start gap-2">
                            <WarningCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{validationError}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        {/* Post Title */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                Title
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Enter post title"
                            />
                        </div>
                        
                        {/* Tags Selection - Moved before content for visibility */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                Tags <span className="text-red-500">*</span>
                                <span className="text-sm font-normal ml-2 text-gray-500">
                                    (At least one of "Dietary tip" or "Recipe" is required)
                                </span>
                            </label>
                            {loading ? (
                                <p>Loading tags...</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(tags) && tags.length > 0 ? (
                                        tags.map(tag => {
                                            // Highlight required tags
                                            const isRequiredTag = REQUIRED_TAG_IDS.includes(tag.id);
                                            // Check if this tag is allowed to be selected
                                            const isAllowed = ALLOWED_TAG_IDS.includes(tag.id);
                                            
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    disabled={!isAllowed}
                                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                                        ${!isAllowed 
                                                            ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                            : selectedTagIds.includes(tag.id)
                                                                ? 'bg-primary text-white'
                                                                : isRequiredTag 
                                                                    ? 'bg-gray-200 dark:bg-gray-700 border-2 border-primary text-gray-800 dark:text-gray-200'
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                        }`}
                                                >
                                                    <Tag size={14} weight="fill" className="mr-1.5" />
                                                    {tag.name}
                                                    {isRequiredTag && !selectedTagIds.includes(tag.id) && 
                                                        <span className="ml-1 text-red-500">*</span>}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500">No tags available</p>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Post content */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">Content</label>
                            <textarea
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                placeholder="Share your thoughts here..."
                            ></textarea>
                        </div>
                        
                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="nh-button nh-button-primary px-6 py-2"
                                disabled={submitting || loading || !hasRequiredTag}
                            >
                                {submitting ? 'Posting...' : 'Create Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost; 