import { Link } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { SignIn, UserPlus } from '@phosphor-icons/react'

// navbar component
const Navbar = () => {
    return (
        <nav className="nh-navbar py-2">
            <div className="nh-container flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <Logo className="text-white" />
                </Link>

                <div className="hidden md:flex space-x-10">
                    <Link to="/" className="text-white hover:text-gray-300">
                        Home
                    </Link>
                    <Link to="/foods" className="text-white hover:text-gray-300">
                        Foods
                    </Link>
                    <Link to="/forum" className="text-white hover:text-gray-300">
                        Forum
                    </Link>
                    <Link to="/api-examples" className="text-white hover:text-gray-300">
                        API Examples
                    </Link>
                </div>

                <div className="flex items-center space-x-5">
                    <ThemeToggle />
                    <div className="flex space-x-2">
                        <Link to="/login" className="nh-button nh-button-primary flex items-center gap-1 w-30">
                            <SignIn size={16} weight="fill" className="inline-block mr-2" />
                            Login
                        </Link>
                        <Link to="/signup" className="nh-button nh-button-outline flex items-center gap-1 w-30">
                            <UserPlus size={16} weight="fill" className="inline-block mr-2" />
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar 