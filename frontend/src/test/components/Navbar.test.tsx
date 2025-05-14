import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

// Mock the useAuth hook
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock the ThemeToggle component
vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">Theme Toggle</div>
}))

// Mock the Logo component
vi.mock('../../components/Logo', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="logo" className={className}>
      Logo Component
    </div>
  )
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn()
  }
})

describe('Navbar Component', () => {
  const mockNavigate = vi.fn()
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Setup the useNavigate mock for each test
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })
  
  it('renders login and signup links when user is not authenticated', () => {
    // Mock the auth context to return unauthenticated state
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      user: null,
      fetchUserProfile: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    // Check if the logo is rendered
    expect(screen.getByTestId('logo')).toBeInTheDocument()
    
    // Check if theme toggle is rendered
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    
    // Check if login and signup links are rendered
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
    
    // Check if navigation links are not rendered
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(screen.queryByText('Foods')).not.toBeInTheDocument()
    expect(screen.queryByText('Forum')).not.toBeInTheDocument()
  })
  
  it('renders navigation links and logout button when user is authenticated', () => {
    // Mock the auth context to return authenticated state
    const mockLogout = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        address: '123 Test St',
        tags: [],
        allergens: []
      },
      fetchUserProfile: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    // Check if the logo is rendered
    expect(screen.getByTestId('logo')).toBeInTheDocument()
    
    // Check if theme toggle is rendered
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    
    // Check if navigation links are rendered
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Foods')).toBeInTheDocument()
    expect(screen.getByText('Forum')).toBeInTheDocument()
    
    // Check if welcome message is displayed
    expect(screen.getByText('Welcome, Test')).toBeInTheDocument()
    
    // Check if logout button is rendered
    expect(screen.getByText('Logout')).toBeInTheDocument()
    
    // Check if login and signup links are not rendered
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })
  
  it('calls logout function and navigates to login page when logout button is clicked', () => {
    // Mock the auth context to return authenticated state
    const mockLogout = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        address: '123 Test St',
        tags: [],
        allergens: []
      },
      fetchUserProfile: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    // Click the logout button
    fireEvent.click(screen.getByText('Logout'))
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled()
    
    // Check if navigate was called with '/login'
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
  
  it('displays username when name is not available', () => {
    // Mock the auth context to return authenticated state with user without name
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: '',
        surname: 'User',
        address: '123 Test St',
        tags: [],
        allergens: []
      },
      fetchUserProfile: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    // Check if welcome message uses username instead
    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument()
  })
})