import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from '../../pages/Home'

// test suite for home page component
describe('Home Page', () => {
    // test if home page renders correctly
    it('renders the home page with all main elements', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        )

        // check if main title is rendered
        expect(screen.getByText('Welcome to NutriHub')).toBeInTheDocument()

        // check if main description is rendered
        expect(screen.getByText(/Your complete nutrition platform/)).toBeInTheDocument()

        // check if main action buttons are rendered
        expect(screen.getByText('Explore Foods')).toBeInTheDocument()
        expect(screen.getByText('Join Forum')).toBeInTheDocument()

        // check if feature cards are rendered
        expect(screen.getByText('Track Nutrition')).toBeInTheDocument()
        expect(screen.getByText('Share Recipes')).toBeInTheDocument()
        expect(screen.getByText('Get Support')).toBeInTheDocument()
    })

    // test if links are properly set up
    it('has correct links to other pages', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        )

        // check if food exploration link is correct
        const foodLink = screen.getByText('Explore Foods').closest('a')
        expect(foodLink).toHaveAttribute('href', '/foods')

        // check if forum link is correct
        const forumLink = screen.getByText('Join Forum').closest('a')
        expect(forumLink).toHaveAttribute('href', '/forum')
    })

    // test button styles and classes
    it('renders buttons with correct styles', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        )

        // get the buttons
        const exploreButton = screen.getByText('Explore Foods').closest('a')
        const forumButton = screen.getByText('Join Forum').closest('a')

        // check if buttons have the correct classes
        expect(exploreButton).toHaveClass('nh-button', 'nh-button-lg', 'nh-button-primary')
        expect(forumButton).toHaveClass('nh-button', 'nh-button-lg', 'nh-button-secondary')

        // check if buttons have flex layout
        expect(exploreButton).toHaveClass('flex', 'items-center', 'justify-center')
        expect(forumButton).toHaveClass('flex', 'items-center', 'justify-center')
    })

    // test button responsiveness
    it('renders buttons in correct responsive layout', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        )

        // find the button container by its unique classes
        const buttonContainer = screen.getByText('Explore Foods').parentElement

        // verify we found the correct container
        expect(buttonContainer).toContainElement(screen.getByText('Explore Foods'))
        expect(buttonContainer).toContainElement(screen.getByText('Join Forum'))

        // check if container has correct responsive classes
        expect(buttonContainer).toHaveClass('flex', 'flex-col', 'md:flex-row')
        expect(buttonContainer).toHaveClass('justify-center', 'gap-8', 'mt-12')
    })
}) 