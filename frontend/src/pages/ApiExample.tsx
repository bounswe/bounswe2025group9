import { useState } from 'react'
import { apiClient, Food, Post, FoodProposal, FoodProposalResponse, AuthResponse } from '../lib/apiClient'

// api example page showcasing mock api endpoints
export default function ApiExample() {
    // state for api data
    const [foods, setFoods] = useState<Food[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [loginResponse, setLoginResponse] = useState<string>('')
    const [proposalResponse, setProposalResponse] = useState<string>('')
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
        foods: false,
        posts: false,
        login: false,
        propose: false
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

    // code examples for documentation
    const codeExamples = {
        getFoods: `// get all foods
const foods = await apiClient.getFoods();`,

        getPosts: `// get all posts
const posts = await apiClient.getPosts();`,

        login: `// login a user
const user = await apiClient.login('test@example.com', 'password123');`,

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

const result = await apiClient.proposeFood(newFood);`
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Mock API Examples</h1>
            <p className="mb-6 text-gray-600">
                This page demonstrates the mock APIs implemented with MSW (Mock Service Worker).
                Each example shows the API call, code sample, and response.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* get foods section */}
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">GET /api/foods</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.getFoods}</pre>
                    </div>
                    <button
                        onClick={fetchFoods}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
                        disabled={isLoading.foods}
                    >
                        {isLoading.foods ? 'Loading...' : 'Fetch Foods'}
                    </button>

                    <div className="max-h-64 overflow-y-auto">
                        {foods.length > 0 ? (
                            <ul className="space-y-2">
                                {foods.map(food => (
                                    <li key={food.id} className="border-b pb-2">
                                        <p className="font-medium">{food.name}</p>
                                        <p className="text-sm text-gray-600">Category: {food.category}</p>
                                        <p className="text-sm text-gray-600">
                                            Nutrition: {food.nutrition.calories} cal, {food.nutrition.protein}g protein
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No foods fetched yet</p>
                        )}
                    </div>
                </div>

                {/* get posts section */}
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">GET /api/posts</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.getPosts}</pre>
                    </div>
                    <button
                        onClick={fetchPosts}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
                        disabled={isLoading.posts}
                    >
                        {isLoading.posts ? 'Loading...' : 'Fetch Posts'}
                    </button>

                    <div className="max-h-64 overflow-y-auto">
                        {posts.length > 0 ? (
                            <ul className="space-y-2">
                                {posts.map(post => (
                                    <li key={post.id} className="border-b pb-2">
                                        <p className="font-medium">{post.title}</p>
                                        <p className="text-sm text-gray-600">By: {post.author} on {post.date}</p>
                                        <p className="text-sm">{post.content.substring(0, 100)}...</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No posts fetched yet</p>
                        )}
                    </div>
                </div>

                {/* login section */}
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">POST /api/login</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.login}</pre>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Using credentials: test@example.com / password123
                    </p>
                    <button
                        onClick={handleLogin}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
                        disabled={isLoading.login}
                    >
                        {isLoading.login ? 'Loading...' : 'Test Login'}
                    </button>

                    <div className="bg-gray-100 p-3 rounded-md overflow-x-auto max-h-40">
                        <pre className="text-sm">{loginResponse || 'No response yet'}</pre>
                    </div>
                </div>

                {/* propose food section */}
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">POST /api/foods/propose</h2>
                    <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm mb-4 overflow-x-auto">
                        <pre>{codeExamples.proposeFood}</pre>
                    </div>
                    <button
                        onClick={proposeFood}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
                        disabled={isLoading.propose}
                    >
                        {isLoading.propose ? 'Loading...' : 'Propose Food'}
                    </button>

                    <div className="bg-gray-100 p-3 rounded-md overflow-x-auto max-h-40">
                        <pre className="text-sm">{proposalResponse || 'No response yet'}</pre>
                    </div>
                </div>
            </div>
        </div>
    )
} 