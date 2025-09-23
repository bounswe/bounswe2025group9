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
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { apiClient, Food, PaginatedResponseWithStatus } from '../../../lib/apiClient'
import Foods from '../../../pages/foods/Foods'
import '@testing-library/jest-dom'

// Mock the apiClient
vi.mock('../../../lib/apiClient', () => ({
    apiClient: {
        getFoods: vi.fn()
    },
    Food: vi.fn(),
    PaginatedResponseWithStatus: vi.fn()
}))

// Mock FoodDetail component to avoid rendering issues
vi.mock('../../../pages/foods/FoodDetail', () => ({
    default: (
        { open }: {open: boolean, onClose: () => void }) => (
        open ? <div data-testid="food-detail-modal">Food Detail Modal</div> : null
    )
}))

// Helper function to render with router
const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Foods Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        
        // Default mock implementation for getFoods
        vi.mocked(apiClient.getFoods).mockResolvedValue({
            results: [],
            count: 0,
            next: null,
            previous: null,
            status: 200
        })
    })

    it('renders the page with all main elements', async () => {
        await act(async () => {
            renderWithRouter(<Foods />)
        })

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
            servingSize: 100,
            caloriesPerServing: 100,
            proteinContent: 10,
            fatContent: 5,
            carbohydrateContent: 20,
            allergens: [],
            dietaryOptions: ['Vegetarian']
        }]
        
        const mockFoods: PaginatedResponseWithStatus<Food> = {
            results,
            count: 1,
            next: null,
            previous: null,
            status: 200
        }
        
        // Set mock response before rendering
        vi.mocked(apiClient.getFoods).mockResolvedValue(mockFoods)
        
        await act(async () => {
            renderWithRouter(<Foods />)
            // Wait a bit for the component to update
            await new Promise(resolve => setTimeout(resolve, 0))
        })
        
        // Check if food item is displayed
        expect(screen.getByText('Test Food')).toBeInTheDocument()
        expect(screen.getByText('Category: Test Category')).toBeInTheDocument()
        expect(screen.getByText('Calories: 100 kcal per 100')).toBeInTheDocument()
        expect(screen.getByText('Dietary Tags: Vegetarian')).toBeInTheDocument()
    })

    it('displays error message when fetch fails', async () => {
        // Set mock to reject before rendering
        vi.mocked(apiClient.getFoods).mockRejectedValue(new Error('Failed to fetch foods'))
        
        await act(async () => {
            renderWithRouter(<Foods />)
            // Wait a bit for the component to update
            await new Promise(resolve => setTimeout(resolve, 0))
        })
        
        // Check if error message is displayed
        expect(screen.getByText('Error fetching foods. Please try again later.')).toBeInTheDocument()
    })

    it('calls getFoods on component mount', async () => {
        await act(async () => {
            renderWithRouter(<Foods />)
            // Wait a bit for the component to update
            await new Promise(resolve => setTimeout(resolve, 0))
        })
        
        // Check that getFoods was called
        expect(apiClient.getFoods).toHaveBeenCalled()
        
        // We don't check the exact number of calls since the component might call it multiple times
        // during initialization, which is fine for this test
        const calls = vi.mocked(apiClient.getFoods).mock.calls
        
        // Check that at least one call was made with the expected parameters
        expect(calls.some(call => 
            call[0]?.page === 1 && call[0]?.search === ''
        )).toBe(true)
    })
}) 