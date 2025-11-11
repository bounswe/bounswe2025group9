# Frontend Tests

We have two types of tests here: component tests and Selenium E2E tests.

## Quick Start

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run a specific test:
```bash
npm test -- src/test/components/Logo.test.tsx
```

## Component Tests

These use Vitest and React Testing Library. Just write normal component tests:

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

## Selenium E2E Tests

For testing real user flows in a browser. First-time setup:

### 1. Install dependencies
```bash
npm install --save-dev selenium-webdriver @types/selenium-webdriver
```

### 2. Install ChromeDriver
```bash
# macOS
brew install chromedriver

# Linux
sudo apt-get install chromium-chromedriver
```

### 3. Run the tests
Start the dev server first:
```bash
npm run dev
```

Then run Selenium tests (in another terminal):
```bash
# Run a single test
npm test -- src/test/selenium/Login.selenium.test.ts

# Run all Selenium tests
npm test -- src/test/selenium
```

### Writing Selenium tests

Check out `selenium/Login.selenium.test.ts` for an example. Basic pattern:

```typescript
import { WebDriver, By, until } from 'selenium-webdriver'
import { createDriver, quitDriver, defaultConfig } from './selenium.config'

describe('My Page', () => {
  let driver: WebDriver

  beforeAll(async () => {
    driver = await createDriver(defaultConfig)
  })

  afterAll(async () => {
    await quitDriver(driver)
  })

  it('does something', async () => {
    await driver.get(`${defaultConfig.baseUrl}/page`)
    const button = await driver.findElement(By.id('submit'))
    await button.click()
    // assertions...
  })
})
```

### Debugging tip
Set `headless: false` in `selenium.config.ts` to see the browser while tests run.

## What to test where

- **Component tests**: Individual components, simple interactions
- **Selenium tests**: Multi-page flows, complex user scenarios, form submissions 