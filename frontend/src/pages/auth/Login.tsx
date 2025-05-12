import { SignIn, Eye, EyeSlash, Check, X } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// login page component
const Login = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    })
    const [loginError, setLoginError] = useState('')
    const [loginErrors, setLoginErrors] = useState<{[key: string]: string}>({})
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Check for success message in location state when component mounts
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message)
            // Clear the location state after reading the message
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

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

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev)
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
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            setLoginError('')
            setLoginErrors({})
            setIsLoading(true)
            try {
                // use auth context login
                await login(formData.username, formData.password)
                
                // redirect to home page
                navigate('/')
            } catch (err: any) {
                console.error('Login error:', err)
                
                // Add more detailed logging to see the exact error structure
                console.log('Error object:', err);
                console.log('Error response:', err.response);
                console.log('Error message:', err.message);
                console.log('Error data:', err.data);
                
                // Check if error has data property (from our custom error in apiClient)
                if (err.data) {
                    const errorData = err.data;
                    setLoginErrors(errorData);
                    
                    if (errorData.detail) {
                        // Handle token authentication error (wrong username/password)
                        setLoginError(errorData.detail);
                        return;
                    }
                    
                    // Get the first error field
                    const firstErrorField = Object.keys(errorData)[0];
                    
                    if (firstErrorField && errorData[firstErrorField]) {
                        const errorMessages = errorData[firstErrorField];
                        let errorMessage = '';
                        
                        if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                            errorMessage = errorMessages[0];
                        } else if (typeof errorMessages === 'string') {
                            errorMessage = errorMessages;
                        }
                        
                        if (errorMessage) {
                            setLoginError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                            return;
                        }
                    }
                    
                    // If we couldn't extract a specific message but have error data
                    setLoginError('Login failed. Please check your credentials.');
                    return;
                }
                
                // Handle different types of errors
                if (err.message && err.message.includes('API error')) {
                    // Extract the actual error from the API error message
                    try {
                        // If the error message itself contains JSON
                        if (err.response && err.response.data) {
                            const errorData = err.response.data;
                            setLoginErrors(errorData);
                            
                            if (errorData.detail) {
                                // Handle token authentication error (wrong username/password)
                                setLoginError(errorData.detail);
                                return;
                            }
                            
                            // Get the first error field
                            const firstErrorField = Object.keys(errorData)[0];
                            
                            if (firstErrorField && errorData[firstErrorField]) {
                                const errorMessages = errorData[firstErrorField];
                                let errorMessage = '';
                                
                                if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                                    errorMessage = errorMessages[0];
                                } else if (typeof errorMessages === 'string') {
                                    errorMessage = errorMessages;
                                }
                                
                                if (errorMessage) {
                                    setLoginError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                                    return;
                                }
                            }
                        }
                    } catch (parseErr) {
                        console.error('Error parsing error message:', parseErr);
                    }
                    
                    // If we couldn't extract a specific error, use the original message
                    setLoginError(err.message);
                } else if (err.response && err.response.data) {
                    const errorData = err.response.data;
                    
                    if (errorData.detail) {
                        // Handle token authentication error (wrong username/password)
                        setLoginError(errorData.detail);
                    } else if (typeof errorData === 'object') {
                        // Handle field validation errors
                        setLoginErrors(errorData);
                        
                        // Get the first error field
                        const firstErrorField = Object.keys(errorData)[0];
                        
                        if (firstErrorField) {
                            // Handle array or string error messages
                            const errorMessages = errorData[firstErrorField];
                            let errorMessage = '';
                            
                            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                                errorMessage = errorMessages[0];
                            } else if (typeof errorMessages === 'string') {
                                errorMessage = errorMessages;
                            }
                            
                            if (errorMessage) {
                                setLoginError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                            } else {
                                setLoginError('Login failed. Please check your credentials.');
                            }
                        } else {
                            setLoginError('Login failed. Please check your credentials.');
                        }
                    } else {
                        setLoginError('Login failed. Please check your credentials.');
                    }
                } else {
                    setLoginError('Invalid username or password');
                }
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="max-w-md mx-auto nh-card">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center">
                            <SignIn size={28} weight="bold" className="text-primary mr-2 mb-3" aria-hidden="true" />
                            <h2 className="nh-title">Login</h2>
                        </div>
                    </div>
                    
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-success rounded-md">
                            <p className="font-medium flex items-center justify-center">
                                <Check size={18} weight="bold" className="mr-1" />
                                {successMessage}
                            </p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.username ? 'border-red-500' : 'border-gray-500'
                                }`}
                                placeholder="Enter your username"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-error p-1.5 rounded-md flex items-center">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.password ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeSlash size={20} weight="regular" />
                                    ) : (
                                        <Eye size={20} weight="regular" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-error p-1.5 rounded-md flex items-center">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="nh-button nh-button-primary w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Show either the general error message OR the field-specific errors, not both */}
                    {loginError && Object.keys(loginErrors).length === 0 && (
                        <p className="mt-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-error p-2 rounded-md flex items-center justify-center">
                            <X size={16} weight="bold" className="mr-1" />
                            {loginError}
                        </p>
                    )}
                    
                    {/* Field-specific backend errors */}
                    {Object.keys(loginErrors).length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <p className="font-medium text-error mb-1 flex items-center">
                                <X size={16} weight="bold" className="mr-1" />
                                Please fix the following errors:
                            </p>
                            <ul className="list-disc pl-5 text-sm text-error">
                                {Object.entries(loginErrors).map(([field, message]) => (
                                    <li key={field}>
                                        <span className="capitalize">{field}</span>: {Array.isArray(message) ? message[0] : message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login