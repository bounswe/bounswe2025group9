# Frontend Tests

This directory contains tests for the frontend components and pages of the NutriHub application.

## Test Structure

The tests are organized as follows:

- `setup.ts`: Contains global test setup code
- `components/`: Tests for individual UI components
- `App.test.tsx`: Tests for the main App component and routing

## Running Tests

To run all tests, use the following command from the frontend directory:

```bash
npm test
```

To run tests in watch mode, which will re-run tests when files change:

```bash
npm test -- --watch
```

To run a specific test file:

```bash
npm test -- path/to/test/file.test.tsx
```

For example, to run only the Logo component tests:

```bash
npm test -- src/test/components/Logo.test.tsx
```

## Test Coverage

To generate a test coverage report:

```bash
npm test -- --coverage
```

This will create a coverage report in the `coverage` directory.

## Testing Libraries Used

- Vitest: Test runner and assertion library
- React Testing Library: For rendering and interacting with React components
- JSDOM: For simulating a browser environment

## Writing New Tests

When writing new tests:

1. Create a new test file with the `.test.tsx` extension
2. Import the necessary testing utilities from Vitest and React Testing Library
3. Use the `describe`, `it`, and `expect` functions to structure your tests
4. Use `render` to render components and `screen` to query the rendered output
5. Use `fireEvent` or `userEvent` to simulate user interactions

Example:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '../../components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Mocking Dependencies

When testing components that have dependencies (like context providers, routers, etc.), use Vitest's mocking capabilities to mock those dependencies:

```tsx
import { vi } from 'vitest'

vi.mock('../../path/to/dependency', () => ({
  useDependency: vi.fn().mockReturnValue({ value: 'mocked value' })
}))
``` 