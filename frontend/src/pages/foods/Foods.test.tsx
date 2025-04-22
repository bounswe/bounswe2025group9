// Test the following:
// - Does the page render?
// - Does the page fetch foods from the API?
// - Does the page display food items?
// - Does the page handle errors?



import { render, screen } from '@testing-library/react';
import Foods from './Foods';
import '@testing-library/jest-dom';

describe('Foods page', () => {
  it('renders without crashing', () => {
    render(<Foods />);
    expect(screen.getByText(/foods/i)).toBeInTheDocument();
  });
});

