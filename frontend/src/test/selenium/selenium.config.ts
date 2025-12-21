import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export interface SeleniumConfig {
  browser: string;
  headless: boolean;
  baseUrl: string;
  defaultTimeout: number;
}

export const defaultConfig: SeleniumConfig = {
  browser: Browser.CHROME,
  headless: false,
  baseUrl: 'http://localhost:8080', // Vite default dev server port
  defaultTimeout: 10000,
};

// Flag to control sequential test execution for non-headless mode
export const shouldRunSequential = !defaultConfig.headless;

export async function createDriver(config: SeleniumConfig = defaultConfig): Promise<WebDriver> {
  const options = new chrome.Options();
  
  if (config.headless) {
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
  }
  
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  
  const driver = await new Builder()
    .forBrowser(config.browser)
    .setChromeOptions(options)
    .build();
  
  await driver.manage().setTimeouts({ implicit: config.defaultTimeout });
  
  return driver;
}

export async function quitDriver(driver: WebDriver): Promise<void> {
  if (driver) {
    await driver.quit();
  }
}

// Test credentials for authentication
export const testCredentials = {
  username: 'HakanFerah61!',
  password: 'HakanFerah61!',
};

// Helper function to login with test credentials
export async function loginWithTestCredentials(driver: WebDriver, config: SeleniumConfig = defaultConfig): Promise<void> {
  await driver.get(`${config.baseUrl}/login`);

  // Wait for login form to load
  await driver.sleep(1000);

  const usernameInput = await driver.findElement({ id: 'username' });
  const passwordInput = await driver.findElement({ id: 'password' });
  const submitButton = await driver.findElement({ css: 'button[type="submit"]' });

  await usernameInput.clear();
  await usernameInput.sendKeys(testCredentials.username);

  await passwordInput.clear();
  await passwordInput.sendKeys(testCredentials.password);

  await submitButton.click();

  // Wait for navigation after login
  await driver.sleep(2000);
}

// Shared driver instance for non-headless mode (one per test file, but files run sequentially)
let sharedDriver: WebDriver | null = null;

// Helper to get or create driver
export async function getDriver(): Promise<WebDriver> {
  if (!defaultConfig.headless && sharedDriver) {
    // Reuse driver within same test file
    return sharedDriver;
  }
  
  // Create new driver
  const driver = await createDriver(defaultConfig);
  
  if (!defaultConfig.headless) {
    sharedDriver = driver;
  }
  
  return driver;
}

// Helper to clean up shared driver
export async function cleanupSharedDriver(): Promise<void> {
  if (sharedDriver) {
    await quitDriver(sharedDriver);
    sharedDriver = null;
  }
}

