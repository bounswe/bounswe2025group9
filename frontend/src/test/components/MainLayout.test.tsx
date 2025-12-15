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
    const navbar = screen.getAllByTestId('navbar-mock')[0]
    const outlet = screen.getAllByTestId('outlet-mock')[0]
    const footer = screen.getAllByTestId('footer-mock')[0]

    expect(navbar).toBeInTheDocument()
    expect(outlet).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
    
    // Check the structure - main should be between navbar and footer
    const container = navbar.parentElement
    const children = Array.from(container?.childNodes || [])

    expect(children[0]).toBe(navbar)
    expect(children[1].contains(outlet)).toBeTruthy()
    expect(children[2]).toBe(footer)
  })
  
  it('has correct CSS classes for layout', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )
    
    // Check if container has flex column layout
    const container = screen.getAllByTestId('navbar-mock')[0].parentElement
    expect(container).toHaveClass('flex', 'flex-col', 'min-h-screen')
    
    // Check if main has flex-grow
    const main = screen.getAllByTestId('outlet-mock')[0].parentElement
    expect(main).toHaveClass('flex-grow')
  })
}) 