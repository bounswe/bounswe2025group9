import { useState } from 'react'
import { apiClient, Food, Post, FoodProposal, FoodProposalResponse, AuthResponse, LikeResponse } from '../lib/apiClient'

// api example page showcasing mock api endpoints
export default function ApiExample() {
    // state for api data
    const [foods, setFoods] = useState<Food[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [loginResponse, setLoginResponse] = useState<string>('')
    const [signupResponse, setSignupResponse] = useState<string>('')
    const [proposalResponse, setProposalResponse] = useState<string>('')
    const [likeResponse, setLikeResponse] = useState<string>('')
    const [getLikesResponse, setGetLikesResponse] = useState<string>('')
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
        foods: false,
        posts: false,
        login: false,
        signup: false,
        propose: false,
        like: false,
        getLikes: false
    })

    // fetch foods example
    const fetchFoods = async () => {
        setIsLoading(prev => ({ ...prev, foods: true }))
        try {
            const data = await apiClient.getFoods()
            setFoods(data)
        } catch (error) {
            console.error('Error fetching foods:', error)
        } finally {
            setIsLoading(prev => ({ ...prev, foods: false }))
        }
    }

    // fetch posts example
    const fetchPosts = async () => {
        setIsLoading(prev => ({ ...prev, posts: true }))
        try {
            const data = await apiClient.getPosts()
            setPosts(data)
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setIsLoading(prev => ({ ...prev, posts: false }))
        }
    }

    // login example - using test credentials
    const handleLogin = async () => {
        setIsLoading(prev => ({ ...prev, login: true }))
        try {
            const data = await apiClient.login("test@example.com", "password123")
            setLoginResponse(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Error logging in:', error)
            setLoginResponse('Error: ' + String(error))
        } finally {
            setIsLoading(prev => ({ ...prev, login: false }))
        }
    }

    // signup example
    const handleSignup = async () => {
        setIsLoading(prev => ({ ...prev, signup: true }))
        try {
            const data = await apiClient.signup("newuser@example.com", "password123", "newuser")
            setSignupResponse(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Error signing up:', error)
            setSignupResponse('Error: ' + String(error))
        } finally {
            setIsLoading(prev => ({ ...prev, signup: false }))
        }
    }

    // propose food example
    const proposeFood = async () => {
        setIsLoading(prev => ({ ...prev, propose: true }))
        try {
            const newFood: FoodProposal = {
                name: "Example Superfood",
                category: "Vegetables",
                nutrition: {
                    calories: 120,
                    protein: 15,
                    carbohydrates: 10,
                    fat: 3
                },
                dietaryTags: ["Vegan", "Gluten-Free"]
            }

            const data = await apiClient.proposeFood(newFood)
            setProposalResponse(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Error proposing food:', error)
            setProposalResponse('Error: ' + String(error))
        } finally {
            setIsLoading(prev => ({ ...prev, propose: false }))
        }
    }

    // like item example
    const likeItem = async () => {
        setIsLoading(prev => ({ ...prev, like: true }))
        try {
            // like the first food (id: 1) as an example
            const data = await apiClient.likeItem(1, "food")
            setLikeResponse(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Error liking item:', error)
            setLikeResponse('Error: ' + String(error))
        } finally {
            setIsLoading(prev => ({ ...prev, like: false }))
        }
    }

    // get item likes example
    const getItemLikes = async () => {
        setIsLoading(prev => ({ ...prev, getLikes: true }))
        try {
            // get likes for food with id 1
            const data = await apiClient.getItemLikes("foods", 1)
            setGetLikesResponse(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Error getting likes:', error)
            setGetLikesResponse('Error: ' + String(error))
        } finally {
            setIsLoading(prev => ({ ...prev, getLikes: false }))
        }
    }

    // code examples for documentation
    const codeExamples = {
        getFoods: `// get all foods
const foods = await apiClient.getFoods();`,

        getPosts: `// get all posts
const posts = await apiClient.getPosts();`,

        login: `// login a user
const user = await apiClient.login('test@example.com', 'password123');`,

        signup: `// register a new user
const newUser = await apiClient.signup('newuser@example.com', 'password123', 'newuser');`,

        proposeFood: `// propose a new food
const newFood = {
  name: "Example Superfood",
  category: "Vegetables",
  nutrition: {
    calories: 120,
    protein: 15,
    carbohydrates: 10,
    fat: 3
  },
  dietaryTags: ["Vegan", "Gluten-Free"]
};

const result = await apiClient.proposeFood(newFood);`,

        likeItem: `// like a food item
const likeResult = await apiClient.likeItem(1, "food");

// like a post
const postLikeResult = await apiClient.likeItem(2, "post");`,

        getItemLikes: `// get likes for a food
const foodLikes = await apiClient.getItemLikes("foods", 1);

// get likes for a post
const postLikes = await apiClient.getItemLikes("posts", 2);`
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-center">Mock API Examples</h1>
            <p className="mb-6 text-gray-600 text-center">
                This page demonstrates all available mock APIs implemented with MSW (Mock Service Worker).
                Each example shows the API call, code sample, and response.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* get foods section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">GET /api/foods</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.getFoods}</pre>
                    </div>
                    <button
                        onClick={fetchFoods}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.foods}
                    >
                        {isLoading.foods ? 'Loading...' : 'Fetch Foods'}
                    </button>

                    <div className="max-h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        {foods.length > 0 ? (
                            <ul className="space-y-2">
                                {foods.map(food => (
                                    <li key={food.id} className="border-b pb-2">
                                        <p className="font-medium text-blue-800">{food.name}</p>
                                        <p className="text-sm text-gray-600">Category: {food.category}</p>
                                        <p className="text-sm text-gray-600">
                                            Nutrition: {food.nutrition.calories} cal, {food.nutrition.protein}g protein
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Likes: {food.likes || 0}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic text-center">No foods fetched yet</p>
                        )}
                    </div>
                </div>

                {/* get posts section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">GET /api/posts</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.getPosts}</pre>
                    </div>
                    <button
                        onClick={fetchPosts}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.posts}
                    >
                        {isLoading.posts ? 'Loading...' : 'Fetch Posts'}
                    </button>

                    <div className="max-h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        {posts.length > 0 ? (
                            <ul className="space-y-2">
                                {posts.map(post => (
                                    <li key={post.id} className="border-b pb-2">
                                        <p className="font-medium text-blue-800">{post.title}</p>
                                        <p className="text-sm text-gray-600">By: {post.author} on {post.date}</p>
                                        <p className="text-sm">{post.content.substring(0, 100)}...</p>
                                        <p className="text-sm text-gray-600">
                                            Likes: {post.likes || 0}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic text-center">No posts fetched yet</p>
                        )}
                    </div>
                </div>

                {/* login section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">POST /api/login</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.login}</pre>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Using credentials: test@example.com / password123
                    </p>
                    <button
                        onClick={handleLogin}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.login}
                    >
                        {isLoading.login ? 'Loading...' : 'Test Login'}
                    </button>

                    <div className="border rounded-md p-3 overflow-x-auto max-h-40 bg-gray-50">
                        <pre className="text-sm">{loginResponse || 'No response yet'}</pre>
                    </div>
                </div>

                {/* signup section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">POST /api/signup</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.signup}</pre>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Using details: newuser@example.com / password123 / newuser
                    </p>
                    <button
                        onClick={handleSignup}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.signup}
                    >
                        {isLoading.signup ? 'Loading...' : 'Test Signup'}
                    </button>

                    <div className="border rounded-md p-3 overflow-x-auto max-h-40 bg-gray-50">
                        <pre className="text-sm">{signupResponse || 'No response yet'}</pre>
                    </div>
                </div>

                {/* propose food section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">POST /api/foods/propose</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.proposeFood}</pre>
                    </div>
                    <button
                        onClick={proposeFood}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.propose}
                    >
                        {isLoading.propose ? 'Loading...' : 'Propose Food'}
                    </button>

                    <div className="border rounded-md p-3 overflow-x-auto max-h-40 bg-gray-50">
                        <pre className="text-sm">{proposalResponse || 'No response yet'}</pre>
                    </div>
                </div>

                {/* like item section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">POST /api/like</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.likeItem}</pre>
                    </div>
                    <button
                        onClick={likeItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.like}
                    >
                        {isLoading.like ? 'Loading...' : 'Like Food (ID: 1)'}
                    </button>

                    <div className="border rounded-md p-3 overflow-x-auto max-h-40 bg-gray-50">
                        <pre className="text-sm">{likeResponse || 'No response yet'}</pre>
                    </div>
                </div>

                {/* get likes section */}
                <div className="border rounded-lg p-4 shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">GET /api/likes/:type/:id</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.getItemLikes}</pre>
                    </div>
                    <button
                        onClick={getItemLikes}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4 w-full transition-colors"
                        disabled={isLoading.getLikes}
                    >
                        {isLoading.getLikes ? 'Loading...' : 'Get Food Likes (ID: 1)'}
                    </button>

                    <div className="border rounded-md p-3 overflow-x-auto max-h-40 bg-gray-50">
                        <pre className="text-sm">{getLikesResponse || 'No response yet'}</pre>
                    </div>
                </div>
            </div>
        </div>
    )
} 