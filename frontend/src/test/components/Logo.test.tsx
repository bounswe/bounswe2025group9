import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '../../components/Logo'

describe('Logo Component', () => {
  it('renders logo image and text correctly', () => {
    render(<Logo />)
    
    // Check if logo image is rendered with correct attributes
    const logoImage = screen.getAllByAltText('NutriHub Logo')[0]
    expect(logoImage).toBeInTheDocument()
    expect(logoImage).toHaveAttribute('src', '/assets/logo.png')
    expect(logoImage).toHaveClass('w-12', 'h-12')
    
    // Check if logo text parts are rendered
    expect(screen.getByText('Nutri')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
  })
  
  it('applies additional className when provided', () => {
    const testClass = 'test-class'
    render(<Logo className={testClass} />)
    
    // Check if the container has the additional class
    const container = screen.getAllByAltText('NutriHub Logo')[0].parentElement
    expect(container).toHaveClass(testClass)
    expect(container).toHaveClass('flex', 'items-center', 'justify-center')
  })
}) 