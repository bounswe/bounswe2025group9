import { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

// Global driver instance shared across all test files
let globalDriver: WebDriver | null = null;

// Get the shared driver instance
export function getGlobalDriver(): WebDriver {
  if (!globalDriver) {
    throw new Error('Global driver not initialized. Make sure globalSetup has run.');
  }
  return globalDriver;
}

// Initialize global driver (called once before all tests)
export async function setup() {
  if (!defaultConfig.headless) {
    console.log('🌐 Starting single browser instance for all tests...');
    globalDriver = await createDriver(defaultConfig);
    
    // Login once for all tests
    console.log('🔐 Logging in with test credentials...');
    await loginWithTestCredentials(globalDriver);
    console.log('✅ Browser ready for tests');
  }
}

// Cleanup global driver (called once after all tests)
export async function teardown() {
  if (globalDriver) {
    console.log('🔚 Closing browser...');
    await quitDriver(globalDriver);
    globalDriver = null;
  }
}

