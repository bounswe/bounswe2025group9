import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react'
import { apiClient, ForumTag, CreateForumPostRequest } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'

// required post types
const POST_TYPES = {
  1: "Dietary tip",
  2: "Recipe"
};

// only these tags are allowed to be selected
const ALLOWED_TAG_IDS = [1, 2];

const CreatePost = () => {
    const navigate = useNavigate();
    const { isAuthenticated, getAccessToken, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [, setTags] = useState<ForumTag[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<number>(1); // default to dietary tip
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
    
    // select tag (radio button style selection)
    const selectTag = (tagId: number) => {
        // only allow selecting from allowed tags
        if (!ALLOWED_TAG_IDS.includes(tagId)) {
            return;
        }
        
        setSelectedTagId(tagId);
        setValidationError('');
    };
    
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
                tag_ids: [selectedTagId] // include only the selected tag
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
                        
                        {/* Post Type Selection - required radio button style selection */}
                        <div className="mb-6">
                            <label className="block mb-2 nh-subtitle text-base">
                                Post Type <span className="text-red-500">*</span>
                                <span className="text-sm font-normal ml-2 text-gray-500">
                                    (Required - select one)
                                </span>
                            </label>
                            {loading ? (
                                <p>Loading post types...</p>
                            ) : (
                                <div className="flex flex-col space-y-2">
                                    {Object.entries(POST_TYPES).map(([id, name]) => {
                                        const tagId = parseInt(id);
                                        return (
                                            <label key={tagId} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="postType"
                                                    checked={selectedTagId === tagId}
                                                    onChange={() => selectTag(tagId)}
                                                    className="form-radio text-primary h-5 w-5"
                                                />
                                                <span className="text-base">{name}</span>
                                            </label>
                                        );
                                    })}
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
                                disabled={submitting || loading}
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