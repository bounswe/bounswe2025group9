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
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

const createFood = (id: number, overrides: Partial<Food> = {}): Food => ({
    id,
    name: `Food ${id}`,
    category: 'Category',
    servingSize: 100,
    caloriesPerServing: 100,
    proteinContent: 10,
    fatContent: 5,
    carbohydrateContent: 20,
    allergens: [],
    dietaryOptions: ['vegan'],
    nutritionScore: 8,
    imageUrl: 'test.jpg',
    ...overrides
})

const buildPaginatedResponse = (results: Food[], overrides: Partial<PaginatedResponseWithStatus<Food>> = {}): PaginatedResponseWithStatus<Food> => ({
    results,
    count: results.length,
    next: null,
    previous: null,
    status: 200,
    ...overrides
})

describe('Foods Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the page with all main elements', () => {
        const mockedGetFoods = vi.mocked(apiClient.getFoods)
        mockedGetFoods.mockResolvedValueOnce(buildPaginatedResponse([]))
        mockedGetFoods.mockResolvedValue(buildPaginatedResponse([]))
        renderWithRouter(<Foods />)

        expect(screen.getByText('Sort Options')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search for a food...')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
        expect(screen.getByText('Add Food')).toBeInTheDocument()
    })

    it('displays food items when fetch is successful', async () => {
        const results: Food[] = [createFood(1, {
            name: 'Test Food',
            category: 'Test Category',
            nutritionScore: 8.5
        })]
        const mockFoods = buildPaginatedResponse(results)
        
        const mockedGetFoods = vi.mocked(apiClient.getFoods)
        mockedGetFoods.mockResolvedValueOnce(mockFoods)
        mockedGetFoods.mockResolvedValue(mockFoods)
        renderWithRouter(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Food')).toBeInTheDocument()
            expect(screen.getByText('Category: Test Category')).toBeInTheDocument()
            expect(screen.getByText('Calories: 100 kcal')).toBeInTheDocument()
            expect(screen.getByText('Calories: 100.0 kcal')).toBeInTheDocument()
        })
    })

    it('displays error message when fetch fails', async () => {
        const mockedGetFoods = vi.mocked(apiClient.getFoods)
        mockedGetFoods.mockRejectedValueOnce(new Error('Failed to fetch foods'))
        mockedGetFoods.mockRejectedValue(new Error('Failed to fetch foods'))
        renderWithRouter(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('Error fetching foods. Please try again later.')).toBeInTheDocument()
        })
    })

    it('calls getFoods on component mount', () => {
        const mockedGetFoods = vi.mocked(apiClient.getFoods)
        mockedGetFoods.mockResolvedValueOnce(buildPaginatedResponse([]))
        mockedGetFoods.mockResolvedValue(buildPaginatedResponse([]))
        renderWithRouter(<Foods />)
        expect(apiClient.getFoods).toHaveBeenCalled()
    })

    it('keeps the total page count stable when the last page has fewer items', async () => {
        const pageOneFoods = Array.from({ length: 10 }, (_, index) => createFood(index + 1))
        const pageTwoFoods = Array.from({ length: 10 }, (_, index) => createFood(index + 11))
        const pageThreeFoods = Array.from({ length: 5 }, (_, index) => createFood(index + 21))

        const mockedGetFoods = vi.mocked(apiClient.getFoods)
        const pageOneResponse = buildPaginatedResponse(pageOneFoods, { count: 25, next: 'page=2' })
        const pageTwoResponse = buildPaginatedResponse(pageTwoFoods, { count: 25, next: 'page=3', previous: 'page=1' })
        const pageThreeResponse = buildPaginatedResponse(pageThreeFoods, { count: 25, next: null, previous: 'page=2' })

        mockedGetFoods
            .mockResolvedValueOnce(pageOneResponse)
            .mockResolvedValueOnce(pageOneResponse)
            .mockResolvedValueOnce(pageTwoResponse)
            .mockResolvedValueOnce(pageThreeResponse)
        mockedGetFoods.mockResolvedValue(pageThreeResponse)

        renderWithRouter(<Foods />)

        await waitFor(() => {
            expect(screen.getByText('Food 1')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: '2' }))

        await waitFor(() => {
            expect(screen.getByText('Food 11')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: '3' }))

        await waitFor(() => {
            expect(apiClient.getFoods).toHaveBeenCalledTimes(4)
        })

        const paginationButtons = screen
            .getAllByRole('button')
            .filter(button => /^\d+$/.test(button.textContent?.trim() || ''))
            .map(button => button.textContent?.trim())

        expect(paginationButtons).toEqual(['1', '2', '3'])
    })
})



