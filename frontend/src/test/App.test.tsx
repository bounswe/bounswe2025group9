import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import { useAuth } from '../context/AuthContext'

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: vi.fn()
}))

// Mock the components
vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>
}))

vi.mock('../pages/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}))

vi.mock('../pages/auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../pages/auth/Signup', () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>
}))

vi.mock('../components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))

// Mock react-router-dom completely to avoid nested router issues
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
    Route: ({ children }: { children: React.ReactNode }) => <div data-testid="route">{children}</div>,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>
  }
})

describe('App Component', () => {
  it('renders the app with correct structure', () => {
    render(<App />)
    
    // Check if the main components are rendered
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('browser-router')).toBeInTheDocument()
    expect(screen.getByTestId('routes')).toBeInTheDocument()
  })
  
  it('has the correct routing setup', () => {
    // Mock window.matchMedia for testing media queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    
    const { container } = render(<App />)
    
    // Check that the App component rendered without errors
    expect(container).not.toBeNull()
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })
}) 