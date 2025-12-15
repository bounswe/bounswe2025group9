import { SignIn, Eye, EyeSlash, Check, X } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

// login page component
const Login = () => {
    const { login } = useAuth()
    const { t } = useLanguage()
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
            newErrors.username = t('auth.usernameRequired')
            isValid = false
        }

        if (!formData.password) {
            newErrors.password = t('auth.passwordRequired')
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
            } catch (err: any) {
                // simple error message for any login failure
                setLoginError(t('auth.loginError'))
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
                            <h2 className="nh-title">{t('auth.login')}</h2>
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
                                placeholder={t('auth.enterUsername')}
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 ${
                                        errors.password ? 'border-red-500' : 'border-gray-500'
                                    }`}
                                    placeholder={t('auth.enterPassword')}
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
                                <p className="nh-error-message">
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
                            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                        </button>
                    </form>

                    {loginError && (
                        <p className="nh-error-message mt-2 justify-center">
                            <X size={16} weight="bold" className="mr-1" />
                            {loginError}
                        </p>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.noAccount')}{' '}
                            <Link to="/signup" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                                {t('nav.signup')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
