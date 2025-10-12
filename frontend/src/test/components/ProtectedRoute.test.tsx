import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock the Outlet component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="protected-content">Protected Content</div>
  }
})

describe('ProtectedRoute Component', () => {
  it('shows loading indicator when authentication is loading', () => {
    // Mock the auth context to return loading state
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      user: null,
      fetchUserProfile: vi.fn()
    })

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Check if loading indicator is displayed using class selector since there's no data-testid
    const loadingElement = container.querySelector('.animate-spin')
    expect(loadingElement).toBeInTheDocument()
    expect(loadingElement).toHaveClass('rounded-full', 'h-12', 'w-12', 'border-t-2', 'border-b-2', 'border-primary')
  })

  it('redirects to login page when user is not authenticated', () => {
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

    // Use MemoryRouter to test navigation
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    )

    // Check if redirected to login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    // Protected content should not be rendered
    expect(container.querySelector('[data-testid="protected-content"]')).not.toBeInTheDocument()
  })

  it('allows access to protected content when user is authenticated', () => {
    // Mock the auth context to return authenticated state with complete user object
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
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Check if protected content is displayed
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('uses custom redirect path when provided', () => {
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

    // Use MemoryRouter with custom redirect path
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
          <Route path="/protected" element={<ProtectedRoute redirectPath="/custom-login" />} />
        </Routes>
      </MemoryRouter>
    )

    // Check if redirected to custom login page
    expect(screen.getByTestId('custom-login')).toBeInTheDocument()
    // Protected content should not be rendered
    expect(container.querySelector('[data-testid="protected-content"]')).not.toBeInTheDocument()
  })
}) 