import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../../pages/auth/Login'
import { useAuth } from '../../../context/AuthContext'

// Mock the useAuth hook
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock useNavigate and useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  }
})

const mockNavigate = vi.fn()
// Allow mockLocation.state to be null or have a message property
const mockLocation: { state: null | { message: string } } = { state: null }

describe('Login Component', () => {
  const mockLogin = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mockLocation to default state
    mockLocation.state = null
    
    // Default mock implementation for useAuth
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      user: null,
      getAccessToken: vi.fn(),
      fetchUserProfile: vi.fn()
    })
  })
  
  it('renders the login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Check if the form elements are rendered
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })
  
  it('shows validation errors when form is submitted with empty fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    // Check if validation errors are displayed
    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })
  
  it('calls login function with correct credentials when form is submitted', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    // Check if login function was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
  })
  
  it('navigates to home page after successful login', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce(undefined)
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    // Wait for the navigation to happen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
  
  it('shows error message when login fails', async () => {
    // Mock failed login
    mockLogin.mockRejectedValueOnce(new Error('Login failed'))
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    })
  })
  
  it('toggles password visibility when eye icon is clicked', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Get the password input and eye button
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = passwordInput.parentElement?.querySelector('button')
    
    // Check initial type is password (hidden)
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click the toggle button
    if (toggleButton) {
      fireEvent.click(toggleButton)
    }
    
    // Check that password is now visible
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide
    if (toggleButton) {
      fireEvent.click(toggleButton)
    }
    
    // Check that password is hidden again
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
  
  it('displays success message from location state', () => {
    // Mock location with success message
    mockLocation.state = { message: 'Account created successfully!' }
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    // Check if success message is displayed
    expect(screen.getByText('Account created successfully!')).toBeInTheDocument()
  })
}) 