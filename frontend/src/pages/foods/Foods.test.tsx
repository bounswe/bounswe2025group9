// Test the following:
// - Does the page render?
// - Does the page display food items?
// - Does the page handle errors?
//- Does the page fetch foods from the API?

// TODO: SEARCH BAR TESTINGS
// - Does the search bar work?
// - Does the search bar display the correct results?

// TODO: FOOD DETAIL PAGE TESTINGS
// - Does the food detail page render?
// - Does the food detail page display the correct information?
// - Does the food detail page handle errors?

// TODO: PROPOSE NEW FOOD PAGE TESTINGS
// - Does the propose new food page render?
// - Does the propose new food page handle errors?
// - Does the propose new food page handle the form submission?

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { apiClient, Food, PaginatedResponseWithStatus } from '../../lib/apiClient'
import Foods from './Foods'
import '@testing-library/jest-dom'

// Mock the apiClient
vi.mock('../../lib/apiClient', () => ({
    apiClient: {
        getFoods: vi.fn()
    }
}))

// Helper function to render with router
const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Foods Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the page with all main elements', () => {
        renderWithRouter(<Foods />)

        // Check if main title and description are rendered
        expect(screen.getByText('Foods Catalog')).toBeInTheDocument()
        expect(screen.getByText('Browse our selection of available foods.')).toBeInTheDocument()

        // Check if search elements are rendered
        expect(screen.getByPlaceholderText('Search for a food...')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
        expect(screen.getByText('Add Food')).toBeInTheDocument()
    })

    it('displays food items when fetch is successful', async () => {
        const results: Food[] = [{
            id: 1,
            name: 'Test Food',
            category: 'Test Category',
            nutritionScore: 8.5,
            imageUrl: 'test.jpg',
            servingSize: 0,
            caloriesPerServing: 0,
            proteinContent: 0,
            fatContent: 0,
            carbohydrateContent: 0,
            allergens: [],
            dietaryOptions: []
        } ]
        const mockFoods: PaginatedResponseWithStatus<Food> = {
            results,
            count: 1,
            next: null,
            previous: null
        }
        
        vi.mocked(apiClient.getFoods).mockResolvedValueOnce(mockFoods)
        renderWithRouter(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Food')).toBeInTheDocument()
            expect(screen.getByText('Category: Test Category')).toBeInTheDocument()
            expect(screen.getByText('Calories: 100 kcal per 100g')).toBeInTheDocument()
        })
    })

    it('displays error message when fetch fails', async () => {
        vi.mocked(apiClient.getFoods).mockRejectedValueOnce(new Error('Failed to fetch foods'))
        renderWithRouter(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('Error fetching foods. Please try again later.')).toBeInTheDocument()
        })
    })

    it('calls getFoods on component mount', () => {
        renderWithRouter(<Foods />)
        expect(apiClient.getFoods).toHaveBeenCalledTimes(1)
    })
})



