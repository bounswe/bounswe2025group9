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

### 3. Setup test user credentials
Make sure your backend has a user with these credentials:
- **Username:** `HakanFerah61!`
- **Password:** `HakanFerah61!`

These are used by tests to access protected routes (foods, forum, meal planner, etc.).

### 4. Run the tests
Start the dev server first:
```bash
npm run dev
```

Then run Selenium tests (in another terminal):
```bash
# Run a single test
npm test -- src/test/selenium/Login.selenium.test.ts

# Run all Selenium tests (runs sequentially with one browser when headless: false)
npm test -- src/test/selenium
```

**Note:** When `headless: false` in `selenium.config.ts`, tests run sequentially in a single visible browser window. This is great for debugging! When `headless: true`, tests run in parallel for speed.

### Writing Selenium tests

Check out `selenium/Login.selenium.test.ts` for an example. Basic patterns:

**For pages that require login (most pages):**
```typescript
import { WebDriver, By } from 'selenium-webdriver'
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config'

describe('My Protected Page', () => {
  let driver: WebDriver

  beforeAll(async () => {
    driver = await getDriver()
    await loginWithTestCredentials(driver) // Login with test credentials
  }, 30000)

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

**For public pages (login/signup):**
```typescript
import { WebDriver, By } from 'selenium-webdriver'
import { createDriver, quitDriver, defaultConfig } from './selenium.config'

describe('Login Page', () => {
  let driver: WebDriver

  beforeAll(async () => {
    driver = await createDriver(defaultConfig) // Always create fresh browser
  }, 30000)

  afterAll(async () => {
    await quitDriver(driver) // Always quit
  })

  it('shows login form', async () => {
    await driver.get(`${defaultConfig.baseUrl}/login`)
    // test login functionality...
  })
})
```

### Debugging tips
- Set `headless: false` in `selenium.config.ts` to see the browser while tests run
- When non-headless, tests run **sequentially** so you can watch each one
- Tests use credentials: `HakanFerah61!` / `HakanFerah61!` for authentication

## What to test where

- **Component tests**: Individual components, simple interactions
- **Selenium tests**: Multi-page flows, complex user scenarios, form submissions 