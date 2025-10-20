import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import TextSizeSettings from './TextSizeSettings'
import { SignIn, UserPlus, SignOut, List, User } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTextSize } from '../context/TextSizeContext'

// navbar component
const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth()
    const { textSize } = useTextSize()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showDesktopNav, setShowDesktopNav] = useState(true)
    const navContainerRef = useRef<HTMLDivElement | null>(null)
    const logoSectionRef = useRef<HTMLDivElement | null>(null)
    const navLinksRef = useRef<HTMLDivElement | null>(null)
    const rightContainerRef = useRef<HTMLDivElement | null>(null)
    const authControlsRef = useRef<HTMLDivElement | null>(null)
    const utilitiesRef = useRef<HTMLDivElement | null>(null)

    const evaluateLayout = useCallback(() => {
        const containerEl = navContainerRef.current
        if (!containerEl) {
            return
        }

        const containerWidth = containerEl.clientWidth
        const logoWidth = logoSectionRef.current?.scrollWidth ?? 0
        const navLinksWidth = navLinksRef.current?.scrollWidth ?? 0
        const authWidth = authControlsRef.current?.scrollWidth ?? 0
        const utilitiesWidth = utilitiesRef.current?.scrollWidth ?? 0

        const rightSections: number[] = []
        if (authWidth > 0) {
            rightSections.push(authWidth)
        }
        if (utilitiesWidth > 0) {
            rightSections.push(utilitiesWidth)
        }

        let rightGapTotal = 0
        if (rightContainerRef.current && rightSections.length > 1) {
            const rawGap = window.getComputedStyle(rightContainerRef.current).gap
            const gapValue = Number.parseFloat(rawGap) || 0
            rightGapTotal = gapValue * (rightSections.length - 1)
        }
        const rightWidth = rightSections.reduce((sum, width) => sum + width, 0) + rightGapTotal

        const topLevelSections: number[] = []
        if (logoWidth > 0) {
            topLevelSections.push(logoWidth)
        }
        if (navLinksWidth > 0) {
            topLevelSections.push(navLinksWidth)
        }
        if (rightWidth > 0) {
            topLevelSections.push(rightWidth)
        }

        let topLevelGapTotal = 0
        if (topLevelSections.length > 1) {
            const rawGap = window.getComputedStyle(containerEl).gap
            const gapValue = Number.parseFloat(rawGap) || 0
            topLevelGapTotal = gapValue * (topLevelSections.length - 1)
        }

        // buffer adds minimal breathing room so edges do not feel cramped
        const buffer = 24
        const requiredWidth =
            topLevelSections.reduce((sum, width) => sum + width, 0) + topLevelGapTotal + buffer

        setShowDesktopNav(requiredWidth <= containerWidth)
    }, [isAuthenticated, user?.profile_image])

    useEffect(() => {
        evaluateLayout()
    }, [evaluateLayout])

    useEffect(() => {
        const handleResize = () => {
            window.requestAnimationFrame(evaluateLayout)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [evaluateLayout])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        const frame = window.requestAnimationFrame(() => {
            evaluateLayout()
        })
        const timeout = window.setTimeout(() => {
            evaluateLayout()
        }, 100)

        return () => {
            window.cancelAnimationFrame(frame)
            window.clearTimeout(timeout)
        }
    }, [textSize, evaluateLayout])

    useEffect(() => {
        if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
            return
        }

        const containerEl = navContainerRef.current
        if (!containerEl) {
            return
        }

        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(evaluateLayout)
        })
        observer.observe(containerEl)

        return () => observer.disconnect()
    }, [evaluateLayout])

    useEffect(() => {
        if (showDesktopNav) {
            setIsMobileMenuOpen(false)
        }
    }, [showDesktopNav])
    
    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }
    
    return (
        <nav className="nh-navbar py-2">
            <div
                className="nh-container relative flex w-full items-center gap-4"
                ref={navContainerRef}
            >
                <div ref={logoSectionRef} className="flex-shrink-0">
                    <Link to={isAuthenticated ? "/" : "/login"} className="flex items-center">
                        <Logo className="text-white" />
                    </Link>
                </div>

                {/* Desktop navigation links - hidden on mobile */}
                <div
                    ref={navLinksRef}
                    className={[
                        'absolute left-1/2 top-1/2 flex -translate-y-1/2 items-center gap-10 transition-opacity',
                        showDesktopNav
                            ? '-translate-x-1/2 opacity-100 pointer-events-auto'
                            : 'pointer-events-none opacity-0',
                    ].join(' ')}
                    aria-hidden={!showDesktopNav}
                >
                    {isAuthenticated ? (
                        <>
                            <Link to="/" className="text-white hover:text-gray-300 whitespace-nowrap">
                                Home
                            </Link>
                            <Link to="/foods" className="text-white hover:text-gray-300 whitespace-nowrap">
                                Foods
                            </Link>
                            <Link to="/forum" className="text-white hover:text-gray-300 whitespace-nowrap">
                                Forum
                            </Link>
                            <Link to="/mealplanner" className="text-white hover:text-gray-300 whitespace-nowrap">
                                Meal Planner
                            </Link>
                        </>
                    ) : null}
                </div>

                <div className="ml-auto flex flex-shrink-0 items-center gap-4" ref={rightContainerRef}>
                    <div
                        ref={authControlsRef}
                        className={[
                            'flex flex-shrink-0 items-center space-x-2',
                            showDesktopNav
                                ? ''
                                : 'pointer-events-none absolute -left-[9999px] opacity-0',
                        ].join(' ')}
                        aria-hidden={!showDesktopNav}
                    >
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    className={user?.profile_image ? "rounded-full overflow-hidden" : "nh-button nh-button-primary flex items-center justify-center"}
                                    style={user?.profile_image ? {} : { padding: '8px 12px' }}
                                    title="View Profile"
                                >
                                    {user?.profile_image ? (
                                        <img
                                            src={user.profile_image}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover"
                                            style={{ aspectRatio: '1/1' }}
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

                    <div className="flex flex-shrink-0 items-center gap-3" ref={utilitiesRef}>
                        <TextSizeSettings />
                        <ThemeToggle />
                    </div>

                    {!showDesktopNav && (
                        <button
                            type="button"
                            onClick={toggleMobileMenu}
                            className="text-white focus:outline-none"
                            aria-label="Toggle navigation menu"
                        >
                            <List size={24} weight="bold" />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile menu - shown when burger is clicked */}
            {!showDesktopNav && isMobileMenuOpen && (
                <div className="nh-container mt-2 mobile-menu p-4">
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
                                            className="w-6 h-6 rounded-full object-cover"
                                            style={{ aspectRatio: '1/1' }}
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
