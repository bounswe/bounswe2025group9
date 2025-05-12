import { UserPlus, Eye, EyeSlash, Check, X } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { apiClient } from '../../lib/apiClient'
import { useNavigate } from 'react-router-dom'

// signup page component (placeholder)
const SignUp = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        address: ''
    })
    const [errors, setErrors] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        address: ''
    })
    const [signupError, setSignupError] = useState('')
    const [signupSuccess, setSignupSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)

    // password validation criteria
    const passwordCriteria = {
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /\d/.test(formData.password),
        passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
    }

    // check if all password criteria are met
    const allCriteriaMet = Object.values(passwordCriteria).every(criteria => criteria)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        if (field === 'password') {
            setShowPassword(prev => !prev)
        } else {
            setShowConfirmPassword(prev => !prev)
        }
    }

    const validateForm = () => {
        let isValid = true
        const newErrors = {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            name: '',
            surname: '',
            address: ''
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required'
            isValid = false
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
            isValid = false
        }

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required'
            isValid = false
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters'
            isValid = false
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required'
            isValid = false
        } else if (!allCriteriaMet) {
            newErrors.password = 'Password does not meet all requirements'
            isValid = false
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
            isValid = false
        }

        // Name validation
        if (!formData.name) {
            newErrors.name = 'First name is required'
            isValid = false
        }

        if (!formData.surname) {
            newErrors.surname = 'Last name is required'
            isValid = false
        }

        // Address validation
        if (!formData.address) {
            newErrors.address = 'Address is required'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            setSignupError('')
            setSignupSuccess(false)
            try {
                console.log('attempting signup with data:', {
                    username: formData.username,
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    address: formData.address
                })
                await apiClient.signup({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    address: formData.address,
                    tags: [],
                    allergens: []
                })
                console.log('signup successful')
                setSignupSuccess(true)
                
                // Redirect to login page after successful signup
                setTimeout(() => {
                    navigate('/login')
                }, 1500)
            } catch (err) {
                console.error('signup failed:', err)
                setSignupError('signup failed, please check your info')
            }
        }
    }

    // icon for password criteria display
    const criteriaIcon = (met: boolean) => {
        return met ? (
            <Check size={16} weight="bold" style={{ color: 'var(--color-success)' }} />
        ) : (
            <X size={16} weight="bold" style={{ color: 'var(--color-error)' }} />
        )
    }

    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="max-w-md mx-auto nh-card">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center">
                            <UserPlus size={28} weight="bold" className="text-primary mr-2" aria-hidden="true" />
                            <h2 className="nh-title">Sign Up</h2>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your first name"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="surname"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.surname ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your last name"
                                />
                                {errors.surname && (
                                    <p className="mt-1 text-sm text-red-500">{errors.surname}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

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
                                placeholder="Choose a username"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('password')}
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
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                            
                            {/* password criteria checklist */}
                            {(passwordFocused || formData.password.length > 0) && (
                                <div className="mt-2 p-2 rounded-md transition-colors" style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderWidth: '1px',
                                    borderColor: 'var(--color-gray-700)',
                                    borderStyle: 'solid'
                                }}>
                                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>Password must have:</p>
                                    <ul className="space-y-1">
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.minLength)}
                                            <span className={`ml-2 ${passwordCriteria.minLength ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                At least 8 characters
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasUppercase)}
                                            <span className={`ml-2 ${passwordCriteria.hasUppercase ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                At least one uppercase letter
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasLowercase)}
                                            <span className={`ml-2 ${passwordCriteria.hasLowercase ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                At least one lowercase letter
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasNumber)}
                                            <span className={`ml-2 ${passwordCriteria.hasNumber ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                At least one number
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeSlash size={20} weight="regular" />
                                    ) : (
                                        <Eye size={20} weight="regular" />
                                    )}
                                </button>
                            </div>
                            {formData.confirmPassword && (
                                <div className="flex items-center mt-1">
                                    {criteriaIcon(passwordCriteria.passwordsMatch)}
                                    <span className={`ml-2 text-sm ${passwordCriteria.passwordsMatch ? 'text-success' : 'text-error'}`}>
                                        {passwordCriteria.passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                    </span>
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.address ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your address"
                            />
                            {errors.address && (
                                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="nh-button nh-button-primary w-full"
                        >
                            Create Account
                        </button>
                    </form>

                    {signupError && (
                        <p className="mt-2 text-sm text-error text-center">{signupError}</p>
                    )}
                    {signupSuccess && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-success rounded-md text-center">
                            <p className="font-medium">Signup successful!</p>
                            <p className="text-sm mt-1">Redirecting to login page...</p>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <a href="/login" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignUp 