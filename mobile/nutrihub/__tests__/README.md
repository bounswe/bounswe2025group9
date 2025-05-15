# Mobile App Tests

This directory contains tests for the NutriHub mobile application. The tests are written using Jest and React Native Testing Library.

## Test Structure

- **Component Tests**: Tests for UI components
  - `Button.test.tsx`: Tests for the Button component
  - `TextInput.test.tsx`: Tests for the TextInput component
  
- **Screen Tests**: Tests for screen components
  - `HomeScreen.test.tsx`: Tests for the HomeScreen component
  - `LoginScreen.test.tsx`: Tests for the Login screen (with mock implementations)
  
- **Service Tests**: Tests for API services
  - `auth.service.test.ts`: Tests for authentication service
  - `client-implementation.test.ts`: Tests for API client implementation
  - `forum.service.test.ts`: Tests for the forum service

- **Context Tests**: Tests for context providers and hooks
  - `AuthContext.test.tsx`: Tests for the authentication context
  - `useForm.test.ts`: Tests for the form hook

## Running Tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- -t "Button"
```

To run tests with coverage report:

```bash
npm test -- --coverage
```

## Testing Setup

The testing environment is set up using:

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native
- **jest.setup.js**: Contains global mocks for common dependencies
- **jest.config.js**: Jest configuration for the project

### Common Testing Patterns

#### Testing React Components

When testing React Native components, we:
1. Mock native modules and UI components
2. Set up appropriate context providers
3. Test rendering and user interactions

Example from `LoginScreen.test.tsx`:
```typescript
// Mock the icon component with variables prefixed with "mock"
jest.mock('@expo/vector-icons', () => {
  return {
    MaterialCommunityIcons: 'MockedMaterialCommunityIcons',
    createIconSet: jest.fn(() => 'MockedIconSet'),
  };
});

// Mock react-native components
jest.mock('react-native', () => {
  const mockComponent = (name: string) => `mock${name}Component`;
  return {
    Image: mockComponent('Image'),
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    // ... other components
  };
});
```

#### Testing Contexts

When testing context providers like `AuthContext`, we:
1. Mock the service layer (e.g., `authService`)
2. Use `renderHook` to test the hook functionality
3. Use `act` for state changes and async operations

Example from `AuthContext.test.tsx`:
```typescript
const { result } = renderHook(() => useAuth(), { wrapper });

// Manually set up the initial state for testing
act(() => {
  // @ts-ignore - directly setting the state for testing
  result.current.user = mockUserProfile;
  // @ts-ignore
  result.current.isLoggedIn = true;
});

// Perform an action
await act(async () => {
  await result.current.logout();
});

// Verify results
expect(result.current.isLoggedIn).toBe(false);
```

#### Testing API Services

When testing API services, we:
1. Mock Axios/fetch responses
2. Test success and error paths
3. Verify correct URL construction and parameter passing

Example from `client-implementation.test.ts`:
```typescript
// Mock successful response
(axios.get as jest.Mock).mockResolvedValueOnce({ 
  data: { data: 'test' }, 
  status: 200 
});

// Make request
const response = await apiClient.get('/test-endpoint');

// Verify behavior
expect(axios.get).toHaveBeenCalled();
expect(response.status).toBe(200);
```

### Important Mocks

Several modules are mocked to ensure tests run properly:

- **@expo/vector-icons**: Mocked to handle font loading and icon rendering
- **@react-native-async-storage/async-storage**: Mocked with Jest functions
- **@react-navigation/native**: Mocked navigation hooks 
- **react-native**: Mocked UI components
- **axios**: Mocked for API testing
- **expo-font**: Mocked to handle font loading

## Troubleshooting Common Test Issues

### React Native Component Rendering

If tests fail with "Objects are not valid as a React child":
- Ensure proper mocking of components that render complex objects
- Use simple string representations for components in tests

### Jest Mock Scope Errors

If tests fail with "Invalid variable access":
- Use string identifiers for mocks instead of complex objects
- Use variables prefixed with "mock" in Jest mocks
- Avoid referencing out-of-scope variables in mock factory functions

### Async Testing Issues

If tests fail with timing or state issues:
- Wrap state updates in `act()`
- Use `waitFor` helpers for asynchronous assertions
- Ensure promises resolve before making assertions

## Writing New Tests

When writing new tests:

1. Create test files in the `__tests__` directory
2. Name test files with the `.test.ts` or `.test.tsx` extension
3. Mock external dependencies when needed
4. Follow the existing patterns for component, screen, and service tests

## Testing Components

React components should be tested for:
- Rendering correctly with different props
- User interactions (press, text input, etc.)
- State changes
- Conditional rendering

## Testing Services

Services should be tested for:
- Successful API calls
- Error handling
- Edge cases
- Response transformations
- Data mapping

## Conventions

- Group related tests in `describe` blocks
- Use clear test descriptions that explain the expected behavior
- Keep test files focused on testing a single component or service
- Mock external dependencies to isolate the code being tested
- Use `beforeEach` to reset mocks between tests 