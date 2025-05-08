import { SignIn } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// login page component
const Login = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    })
    const [loginError, setLoginError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = () => {
        let isValid = true
        const newErrors = {
            username: '',
            password: ''
        }

        if (!formData.username) {
            newErrors.username = 'Username is required'
            isValid = false
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
            isValid = false
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            setLoginError('')
            setIsLoading(true)
            try {
                // use auth context login
                await login(formData.username, formData.password)
                
                // redirect to home page
                navigate('/')
            } catch (err) {
                setLoginError('Invalid username or password')
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="max-w-md mx-auto nh-card">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center mr-2">
                            <SignIn size={28} weight="bold" className="text-primary flex-shrink-0" />
                        </div>
                        <h2 className="nh-title text-center">Login</h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.username ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your username"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {loginError && (
                        <p className="mt-2 text-sm text-red-500 text-center">{loginError}</p>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-primary hover:text-primary-dark">
                                Sign up
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login