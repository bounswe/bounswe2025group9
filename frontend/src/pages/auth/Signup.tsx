import { UserPlus, Eye, EyeSlash, Check, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { apiClient } from '../../lib/apiClient'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// signup page component (placeholder)
const SignUp = () => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: ''
    })
    const [errors, setErrors] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: ''
    })
    const [signupError, setSignupError] = useState('')
    const [signupErrors, setSignupErrors] = useState<{[key: string]: string}>({})
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
            surname: ''
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = t('auth.emailRequired')
            isValid = false
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('auth.emailInvalid')
            isValid = false
        }

        // Username validation
        if (!formData.username) {
            newErrors.username = t('auth.usernameRequired')
            isValid = false
        } else if (formData.username.length < 3) {
            newErrors.username = t('auth.usernameMinLength')
            isValid = false
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = t('auth.passwordRequired')
            isValid = false
        } else if (!allCriteriaMet) {
            newErrors.password = t('auth.passwordNotMeetReq')
            isValid = false
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.passwordsNotMatch')
            isValid = false
        }

        // Name validation
        if (!formData.name) {
            newErrors.name = t('auth.firstNameRequired')
            isValid = false
        }

        if (!formData.surname) {
            newErrors.surname = t('auth.lastNameRequired')
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            setSignupError('')
            setSignupErrors({})
            setSignupSuccess(false)
            try {
                console.log('attempting signup with data:', {
                    username: formData.username,
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                })
                await apiClient.signup({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    tags: [],
                    allergens: []
                })
                console.log('signup successful')
                setSignupSuccess(true)
                
                // Redirect to login page after successful signup
                setTimeout(() => {
                    navigate('/login')
                }, 1500)
            } catch (err: any) {
                console.error('signup failed:', err)
                
                // Add more detailed logging to see the exact error structure
                console.log('Error object:', err);
                console.log('Error response:', err.response);
                console.log('Error message:', err.message);
                console.log('Error data:', err.data);
                
                // Check if error has data property (from our custom error in apiClient)
                if (err.data) {
                    const errorData = err.data;
                    setSignupErrors(errorData);
                    
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
                            setSignupError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                            return;
                        }
                    }
                    
                    // If we couldn't extract a specific message but have error data
                    setSignupError(t('auth.signupError'));
                    return;
                }
                
                // Handle different types of errors
                if (err.message && err.message.includes('API error')) {
                    // Extract the actual error from the API error message
                    try {
                        // If the error message itself contains JSON
                        if (err.response && err.response.data) {
                            const errorData = err.response.data;
                            setSignupErrors(errorData);
                            
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
                                    setSignupError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                                    return;
                                }
                            }
                        }
                    } catch (parseErr) {
                        console.error('Error parsing error message:', parseErr);
                    }
                    
                    // If we couldn't extract a specific error, use the original message
                    setSignupError(err.message);
                } else if (err.response && err.response.data) {
                    const errorData = err.response.data;
                    
                    if (typeof errorData === 'object') {
                        setSignupErrors(errorData);
                        
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
                                setSignupError(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${errorMessage}`);
                            } else {
                                setSignupError(t('auth.signupError'));
                            }
                        } else {
                            setSignupError(t('auth.signupError'));
                        }
                    } else {
                        setSignupError(t('auth.signupError'));
                    }
                } else {
                    setSignupError(t('auth.networkError'));
                }
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
                            <UserPlus size={28} weight="bold" className="text-primary mr-2 mb-3" aria-hidden="true" />
                            <h2 className="nh-title">{t('auth.signup')}</h2>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                    {t('auth.firstName')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.name ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder={t('auth.enterFirstName')}
                                />
                                {errors.name && (
                                    <p className="nh-error-message">
                                        <X size={14} weight="bold" className="mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="surname" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                    {t('auth.lastName')}
                                </label>
                                <input
                                    type="text"
                                    id="surname"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.surname ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder={t('auth.enterLastName')}
                                />
                                {errors.surname && (
                                    <p className="nh-error-message">
                                        <X size={14} weight="bold" className="mr-1" />
                                        {errors.surname}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                    errors.email ? 'border-red-500' : 'border-gray-500'
                                }`}
                                placeholder={t('auth.enterEmail')}
                            />
                            {errors.email && (
                                <p className="nh-error-message">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                {t('auth.username')}
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
                                placeholder={t('auth.chooseUsername')}
                            />
                            {errors.username && (
                                <p className="nh-error-message">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                {t('auth.password')}
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
                                        errors.password ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder={t('auth.createPassword')}
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
                                <p className="nh-error-message">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.password}
                                </p>
                            )}
                            
                            {/* password criteria checklist */}
                            {(passwordFocused || formData.password.length > 0) && (
                                <div className="mt-2 p-2 rounded-md transition-colors" style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderWidth: '1px',
                                    borderColor: 'var(--color-gray-700)',
                                    borderStyle: 'solid'
                                }}>
                                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>{t('auth.passwordMustHave')}</p>
                                    <ul className="space-y-1">
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.minLength)}
                                            <span className={`ml-2 ${passwordCriteria.minLength ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                {t('auth.atLeast8Chars')}
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasUppercase)}
                                            <span className={`ml-2 ${passwordCriteria.hasUppercase ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                {t('auth.atLeastOneUppercase')}
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasLowercase)}
                                            <span className={`ml-2 ${passwordCriteria.hasLowercase ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                {t('auth.atLeastOneLowercase')}
                                            </span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            {criteriaIcon(passwordCriteria.hasNumber)}
                                            <span className={`ml-2 ${passwordCriteria.hasNumber ? 'opacity-80' : 'opacity-100'}`} style={{ color: 'var(--color-light)' }}>
                                                {t('auth.atLeastOneNumber')}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-light)' }}>
                                {t('auth.confirmPassword')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder={t('auth.confirmYourPassword')}
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
                                    <span className="ml-2 text-sm" style={{ color: passwordCriteria.passwordsMatch ? 'var(--color-success)' : 'var(--color-error)' }}>
                                        {passwordCriteria.passwordsMatch ? t('auth.passwordsMatch') : t('auth.passwordsDoNotMatch')}
                                    </span>
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="nh-error-message">
                                    <X size={14} weight="bold" className="mr-1" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="nh-button nh-button-primary w-full"
                            style={{ display: 'inline-block' }}
                        >
                            {t('auth.createAccount')}
                        </button>
                    </form>

                    {/* Show either the general error message OR the field-specific errors, not both */}
                    {signupError && Object.keys(signupErrors).length === 0 && (
                        <p className="nh-error-message mt-2 justify-center">
                            <X size={16} weight="bold" className="mr-1" />
                            {signupError}
                        </p>
                    )}
                    
                    {/* Field-specific backend errors */}
                    {Object.keys(signupErrors).length > 0 && (
                        <div className="nh-error-list">
                            <ul>
                                {Object.entries(signupErrors).map(([field, message]) => (
                                    <li key={field}>
                                        <span className="capitalize">{field}</span>: {Array.isArray(message) ? message[0] : message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {signupSuccess && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-success rounded-md text-center">
                            <p className="font-medium flex items-center justify-center">
                                <Check size={18} weight="bold" className="mr-1" />
                                {t('auth.signupSuccess')}
                            </p>
                            <p className="text-sm mt-1">{t('auth.redirectingToLogin')}</p>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.hasAccount')}{' '}
                            <Link to="/login" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                                {t('auth.signIn')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignUp 
