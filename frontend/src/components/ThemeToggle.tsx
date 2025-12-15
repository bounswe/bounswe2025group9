import { useState, useEffect } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { useLanguage } from '../context/LanguageContext'

// theme toggle component for switching between light and dark mode
const ThemeToggle = () => {
    const { t } = useLanguage()
    // initialize state from localStorage or default to dark mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme ? savedTheme === 'dark' : true // default to dark if not set
    })

    useEffect(() => {
        // apply theme class to document body
        if (isDarkMode) {
            document.documentElement.classList.add('dark-theme')
            document.documentElement.classList.remove('light-theme')
            // save preference to localStorage
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.add('light-theme')
            document.documentElement.classList.remove('dark-theme')
            // save preference to localStorage
            localStorage.setItem('theme', 'light')
        }
    }, [isDarkMode])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full focus:outline-none border border-transparent cursor-pointer"
            aria-label={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
            title={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
        >
            {isDarkMode ? (
                <Moon size={20} weight="fill" className="text-white" />
            ) : (
                <Sun size={20} weight="fill" className="text-yellow-300" />
            )}
        </button>
    )
}

export default ThemeToggle 