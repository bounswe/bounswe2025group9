// Test the following:
// - Does the page render?
// - Does the page fetch foods from the API?
// - Does the page display food items?
// - Does the page handle errors?

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { apiClient } from '../../lib/apiClient'
import Foods from './Foods'
import '@testing-library/jest-dom'

// Mock the apiClient
vi.mock('../../lib/apiClient', () => ({
    apiClient: {
        getFoods: vi.fn()
    }
}))

describe('Foods Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the page with all main elements', () => {
        render(<Foods />)

        // Check if main title and description are rendered
        expect(screen.getByText('Foods Catalog')).toBeInTheDocument()
        expect(screen.getByText('Browse our selection of available foods.')).toBeInTheDocument()

        // Check if search elements are rendered
        expect(screen.getByPlaceholderText('Search for a food...')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
        expect(screen.getByText('Add Food')).toBeInTheDocument()
    })

    it('displays food items when fetch is successful', async () => {
        const mockFoods = [{
            id: 1,
            name: 'Test Food',
            category: 'Test Category',
            nutrition: { calories: 100, protein: 10, carbohydrates: 20, fat: 5, vitamins: {}, minerals: {} },
            nutritionScore: 8.5,
            dietaryTags: ['test'],
            perUnit: '100g',
            imageUrl: 'test.jpg'
        }]
        
        vi.mocked(apiClient.getFoods).mockResolvedValueOnce(mockFoods)
        render(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Food')).toBeInTheDocument()
            expect(screen.getByText('Category: Test Category')).toBeInTheDocument()
            expect(screen.getByText('Calories: 100 kcal per 100g')).toBeInTheDocument()
        })
    })

    it('displays error message when fetch fails', async () => {
        vi.mocked(apiClient.getFoods).mockRejectedValueOnce(new Error('Failed to fetch foods'))
        render(<Foods />)
        
        await waitFor(() => {
            expect(screen.getByText('No foods available. Please try again later.')).toBeInTheDocument()
        })
    })

    it('calls getFoods on component mount', () => {
        render(<Foods />)
        expect(apiClient.getFoods).toHaveBeenCalledTimes(1)
    })
})



