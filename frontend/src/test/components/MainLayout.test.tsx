import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'

// Mock the child components
vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar-mock">Navbar Component</div>
}))

vi.mock('../../components/Footer', () => ({
  default: () => <div data-testid="footer-mock">Footer Component</div>
}))

// Mock the Outlet component from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-mock">Outlet Content</div>
  }
})

describe('MainLayout Component', () => {
  it('renders navbar, outlet, and footer in correct structure', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )
    
    // Check if all components are rendered
    expect(screen.getByTestId('navbar-mock')).toBeInTheDocument()
    expect(screen.getByTestId('outlet-mock')).toBeInTheDocument()
    expect(screen.getByTestId('footer-mock')).toBeInTheDocument()
    
    // Check the structure - main should be between navbar and footer
    const container = screen.getByTestId('navbar-mock').parentElement
    const children = Array.from(container?.childNodes || [])
    
    expect(children[0]).toBe(screen.getByTestId('navbar-mock'))
    expect(children[1].contains(screen.getByTestId('outlet-mock'))).toBeTruthy()
    expect(children[2]).toBe(screen.getByTestId('footer-mock'))
  })
  
  it('has correct CSS classes for layout', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )
    
    // Check if container has flex column layout
    const container = screen.getByTestId('navbar-mock').parentElement
    expect(container).toHaveClass('flex', 'flex-col', 'min-h-screen')
    
    // Check if main has flex-grow
    const main = screen.getByTestId('outlet-mock').parentElement
    expect(main).toHaveClass('flex-grow')
  })
}) 