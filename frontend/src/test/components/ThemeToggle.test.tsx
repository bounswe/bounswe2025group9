import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '../../components/ThemeToggle'

describe('ThemeToggle Component', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      clear: () => {
        store = {}
      }
    }
  })()

  // Mock document methods
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    document.documentElement.classList.remove('dark-theme', 'light-theme')
    localStorageMock.clear()
    
    // Spy on classList methods
    vi.spyOn(document.documentElement.classList, 'add')
    vi.spyOn(document.documentElement.classList, 'remove')
  })

  it('renders with default dark theme when no theme is stored', () => {
    render(<ThemeToggle />)
    
    // Check if the Moon icon is displayed (dark mode)
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark-theme')
  })

  it('renders with light theme when light theme is stored', () => {
    localStorageMock.setItem('theme', 'light')
    render(<ThemeToggle />)
    
    // Check if the Sun icon is displayed (light mode)
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('light-theme')
  })

  it('toggles theme when button is clicked', () => {
    // Start with dark theme
    localStorageMock.setItem('theme', 'dark')
    render(<ThemeToggle />)
    
    // Initial state check
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
    
    // Click the toggle button
    fireEvent.click(screen.getByLabelText('Switch to light mode'))
    
    // Check if theme has changed to light
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    expect(localStorageMock.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('light-theme')
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark-theme')
    
    // Click again to toggle back to dark
    fireEvent.click(screen.getByLabelText('Switch to dark mode'))
    
    // Check if theme has changed back to dark
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
    expect(localStorageMock.getItem('theme')).toBe('dark')
  })
})