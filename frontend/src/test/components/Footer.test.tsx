import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../../components/Footer'

describe('Footer Component', () => {
  it('renders the footer with correct content', () => {
    render(<Footer />)
    
    // Check if the logo text is displayed
    expect(screen.getByText('NutriHub')).toBeInTheDocument()
    
    // Check if the tagline is displayed
    expect(screen.getByText('Your journey to healthier eating starts here')).toBeInTheDocument()
    
    // Check if the Connect section is displayed
    expect(screen.getByText('Connect')).toBeInTheDocument()
    
    // Check if the GitHub link is displayed
    const githubLink = screen.getByText('GitHub')
    expect(githubLink).toBeInTheDocument()
    expect(githubLink.closest('a')).toHaveAttribute('href', 'https://github.com/bounswe/bounswe2025group9')
    expect(githubLink.closest('a')).toHaveAttribute('target', '_blank')
    expect(githubLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })
  
  it('displays the current year in the copyright notice', () => {
    render(<Footer />)
    
    // Get the current year
    const currentYear = new Date().getFullYear().toString()
    
    // Check if the copyright text includes the current year
    const copyrightText = screen.getByText((content) => 
      content.includes(currentYear) && content.includes('NutriHub') && content.includes('BOUN SWE 2025 Group 9')
    )
    expect(copyrightText).toBeInTheDocument()
  })
  
  it('has the correct CSS classes for styling', () => {
    render(<Footer />)
    
    // Check if the footer has the correct class
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('nh-footer')
    
    // Check if the container has the correct class
    const container = footer.firstChild
    expect(container).toHaveClass('nh-container')
    
    // Check if the border is applied to the copyright section
    const copyrightSection = screen.getByText((content) => 
      content.includes('NutriHub') && content.includes('BOUN SWE 2025 Group 9')
    ).closest('div')
    expect(copyrightSection).toHaveClass('border-t', 'border-gray-700', 'mt-6', 'pt-6')
  })
}) 