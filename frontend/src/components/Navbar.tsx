import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { SignIn, UserPlus, SignOut } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

// navbar component
const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth()
    const navigate = useNavigate()
    
    const handleLogout = () => {
        logout()
        navigate('/login')
    }
    
    return (
        <nav className="nh-navbar py-2">
            <div className="nh-container grid grid-cols-3 items-center">
                <div>
                    <Link to={isAuthenticated ? "/" : "/login"} className="flex items-center">
                        <Logo className="text-white" />
                    </Link>
                </div>

                {isAuthenticated ? (
                    <div className="flex justify-center space-x-10">
                        <Link to="/" className="text-white hover:text-gray-300">
                            Home
                        </Link>
                        <Link to="/foods" className="text-white hover:text-gray-300">
                            Foods
                        </Link>
                        <Link to="/forum" className="text-white hover:text-gray-300">
                            Forum
                        </Link>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        {/* Empty center column when not authenticated */}
                    </div>
                )}

                <div className="flex items-center space-x-5 justify-end">
                    <ThemeToggle />
                    <div className="flex space-x-2">
                        {isAuthenticated ? (
                            <>
                                {user && (
                                    <div className="text-white mr-4 flex items-center">
                                        Welcome, {user.name || user.username || 'User'}
                                    </div>
                                )}
                                <button 
                                    onClick={handleLogout}
                                    className="nh-button nh-button-primary flex items-center gap-1 w-30"
                                >
                                    <SignOut size={16} weight="fill" className="inline-block mr-2" />
                                    Logout
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
                </div>
            </div>
        </nav>
    )
}

export default Navbar 