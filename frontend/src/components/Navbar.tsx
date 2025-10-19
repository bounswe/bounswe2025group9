import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { SignIn, UserPlus, SignOut, List, User } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

// navbar component
const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    
    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }
    
    return (
        <nav className="nh-navbar py-2">
            <div className="nh-container grid grid-cols-2 lg:grid-cols-3 items-center">
                <div>
                    <Link to={isAuthenticated ? "/" : "/login"} className="flex items-center">
                        <Logo className="text-white" />
                    </Link>
                </div>

                {/* Desktop navigation links - hidden on mobile */}
                {isAuthenticated ? (
                    <div className="hidden lg:flex justify-center space-x-10">
                        <Link to="/" className="text-white hover:text-gray-300">
                            Home
                        </Link>
                        <Link to="/foods" className="text-white hover:text-gray-300">
                            Foods
                        </Link>
                        <Link to="/forum" className="text-white hover:text-gray-300">
                            Forum
                        </Link>
                        <Link to="/mealplanner" className="text-white hover:text-gray-300">
                            Meal Planner
                        </Link>
                    </div>
                ) : (
                    <div className="hidden lg:flex justify-center">
                        {/* Empty center column when not authenticated */}
                    </div>
                )}

                <div className="flex items-center space-x-5 justify-end">
                    {/* Desktop auth buttons - hidden on mobile */}
                    <div className="hidden lg:flex space-x-2 items-center">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="nh-button nh-button-primary flex items-center justify-center"
                                    style={{ padding: '8px 12px' }}
                                    title="View Profile"
                                >
                                    {user?.profile_image ? (
                                        <img
                                            src={user.profile_image}
                                            alt="Profile"
                                            className="w-6 h-6 rounded-full object-cover border-2 border-white"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <User size={24} className="text-white" weight="fill" />
                                        </div>
                                    )}
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="nh-button nh-button-primary flex items-center justify-center"
                                    style={{ padding: '8px 12px' }}
                                    title="Logout"
                                >
                                    <SignOut size={24} weight="fill" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nh-button nh-button-primary flex items-center gap-1 w-30">
                                    <SignIn size={16} weight="fill" className="inline-block mr-2" />
                                    Login
                                </Link>
                                <Link to="/signup" className="nh-button nh-button-outline flex items-center gap-1 w-30">
                                    <UserPlus size={16} weight="fill" className="inline-block mr-2" />
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center">
                        <ThemeToggle />
                    </div>
                    
                    {/* Hamburger menu for small screens - moved to the far right */}
                    <div className="lg:hidden flex items-center">
                        <button 
                            onClick={toggleMobileMenu}
                            className="text-white focus:outline-none"
                        >
                            <List size={24} weight="bold" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu - shown when burger is clicked */}
            {isMobileMenuOpen && (
                <div className="lg:hidden nh-container mt-2 mobile-menu p-4">
                    {isAuthenticated ? (
                        <div className="flex flex-col space-y-4">
                            <Link 
                                to="/" 
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link 
                                to="/foods" 
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Foods
                            </Link>
                            <Link 
                                to="/forum" 
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Forum
                            </Link>
                            <div className="pt-2 border-t divider flex flex-col gap-3">
                                <Link
                                    to="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3"
                                >
                                    {user?.profile_image ? (
                                        <img
                                            src={user.profile_image}
                                            alt="Profile"
                                            className="w-6 h-6 rounded-full object-cover border-2 border-primary-500"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <User size={24} className="text-gray-700 dark:text-gray-300" weight="fill" />
                                        </div>
                                    )}
                                    <span>Profile</span>
                                </Link>
                                <button 
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="nh-button nh-button-primary flex items-center gap-1 w-full"
                                >
                                    <SignOut size={16} weight="fill" className="inline-block mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-3">
                            <Link 
                                to="/login" 
                                className="nh-button nh-button-primary flex items-center justify-center gap-1 w-full"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <SignIn size={16} weight="fill" className="inline-block mr-2" />
                                Login
                            </Link>
                            <Link 
                                to="/signup" 
                                className="nh-button nh-button-outline flex items-center justify-center gap-1 w-full"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <UserPlus size={16} weight="fill" className="inline-block mr-2" />
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    )
}

export default Navbar 