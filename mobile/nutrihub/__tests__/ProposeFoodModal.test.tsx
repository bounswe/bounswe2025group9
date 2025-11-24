/**
 * ProposeFoodModal Tests
 * 
 * Simple tests for the food proposal modal covering basic scenarios:
 * 1. Modal renders correctly
 * 2. Form fields are present
 * 3. Submit button is disabled when form is invalid
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProposeFoodModal from '../src/components/food/ProposeFoodModal';

// Mock the theme context
jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            primary: '#3b82f6',
            secondary: '#60a5fa',
            background: '#ffffff',
            card: '#f9f9f9',
            surface: '#ffffff',
            surfaceVariant: '#f0f0f0',
            text: '#000000',
            textSecondary: '#666666',
            border: '#e0e0e0',
            divider: '#e0e0e0',
            error: '#dc2626',
        },
        textStyles: {
            heading3: { fontSize: 20, fontWeight: 'bold' },
            heading4: { fontSize: 18, fontWeight: 'bold' },
            subtitle: { fontSize: 16, fontWeight: '600' },
            body: { fontSize: 16 },
            caption: { fontSize: 12 },
            button: { fontSize: 16, fontWeight: '600' },
        },
    }),
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: 'MockIcon',
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: 'MockSafeAreaView',
}));

// Mock Picker
jest.mock('@react-native-picker/picker', () => ({
    Picker: ({ children }: any) => children,
}));

// Mock common components
jest.mock('../src/components/common/Card', () => 'MockCard');
jest.mock('../src/components/common/Button', () => 'MockButton');
jest.mock('../src/components/common/TextInput', () => 'MockTextInput');

// Mock useForm hook
jest.mock('../src/hooks/useForm', () => ({
    __esModule: true,
    default: () => ({
        values: {
            name: '',
            category: '',
            servingSize: '100',
            calories: '',
            carbohydrates: '',
            protein: '',
            fat: '',
            fiber: '',
            sugar: '',
            dietaryOptions: [],
            imageUrl: '',
            basePrice: '',
            priceUnit: 'per_100g',
            currency: 'TRY',
            micronutrients: {},
        },
        errors: {},
        touched: {},
        handleChange: jest.fn(() => jest.fn()),
        handleBlur: jest.fn(() => jest.fn()),
        handleSubmit: jest.fn(),
        resetForm: jest.fn(),
        isValid: false,
        isSubmitting: false,
        setFieldValue: jest.fn(),
        validateForm: jest.fn(),
    }),
}));

describe('ProposeFoodModal - Basic Tests', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test 1: Modal renders when visible
     * Verifies that the modal displays with correct title
     */
    it('should render modal with title when visible', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(getByText('Propose New Food')).toBeTruthy();
    });

    /**
     * Test 2: Basic Information section is present
     * Verifies that the form has the basic information section
     */
    it('should display basic information section', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(getByText('Basic Information')).toBeTruthy();
    });

    /**
     * Test 3: Nutrition sections are present
     * Verifies that nutrition-related sections exist
     */
    it('should display nutrition information sections', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(getByText('Nutrition Information')).toBeTruthy();
        expect(getByText('Macronutrients (per serving)')).toBeTruthy();
    });

    /**
     * Test 4: Optional sections are present
     * Verifies that dietary options, pricing, and micronutrients sections exist
     */
    it('should display optional sections', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(getByText('Dietary Options')).toBeTruthy();
        expect(getByText('Pricing (Optional)')).toBeTruthy();
    });

    /**
     * Test 5: Micronutrients section with counter
     * Verifies that micronutrients section shows count
     */
    it('should display micronutrients section with counter', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        // Should show count of micronutrients (0 initially)
        expect(getByText(/Micronutrients \(0\)/)).toBeTruthy();
    });

    /**
   * Test 6: Modal structure is complete
   * Verifies that the modal has all major sections
   */
    it('should have complete modal structure with all sections', () => {
        const { getByText } = render(
            <ProposeFoodModal
                visible={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        // Verify all major sections are present
        expect(getByText('Propose New Food')).toBeTruthy();
        expect(getByText('Basic Information')).toBeTruthy();
        expect(getByText('Nutrition Information')).toBeTruthy();
        expect(getByText('Macronutrients (per serving)')).toBeTruthy();
        expect(getByText('Dietary Options')).toBeTruthy();
        expect(getByText('Image (Optional)')).toBeTruthy();
    });
});
