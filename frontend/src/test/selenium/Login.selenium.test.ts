import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, testCredentials } from './selenium.config';

describe('Login Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    // Create a new browser instance before running tests
    driver = await createDriver(defaultConfig);
  }, 30000); // 30 second timeout for browser startup

  afterAll(async () => {
    // Close the browser after all tests are done
    await quitDriver(driver);
  });

  it('should display login form with all required elements', async () => {
    // Navigate to the login page
    await driver.get(`${defaultConfig.baseUrl}/login`);

    // Wait for the page to load and find the login title
    const title = await driver.wait(
      until.elementLocated(By.xpath("//h2[contains(text(), 'Login')]")),
      defaultConfig.defaultTimeout
    );
    expect(await title.isDisplayed()).toBe(true);

    // Check that username input exists
    const usernameInput = await driver.findElement(By.id('username'));
    expect(await usernameInput.isDisplayed()).toBe(true);
    expect(await usernameInput.getAttribute('placeholder')).toBe('Enter your username');

    // Check that password input exists
    const passwordInput = await driver.findElement(By.id('password'));
    expect(await passwordInput.isDisplayed()).toBe(true);
    expect(await passwordInput.getAttribute('placeholder')).toBe('Enter your password');

    // Check that submit button exists
    const submitButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    expect(await submitButton.isDisplayed()).toBe(true);
    expect(await submitButton.getText()).toBe('Sign In');

    // Check that sign up link exists
    const signupLink = await driver.findElement(By.linkText('Sign up'));
    expect(await signupLink.isDisplayed()).toBe(true);
    expect(await signupLink.getAttribute('href')).toContain('/signup');
  }, 30000);

  it('should show validation errors when submitting empty form', async () => {
    // Navigate to the login page
    await driver.get(`${defaultConfig.baseUrl}/login`);

    // Wait for the form to load
    await driver.wait(
      until.elementLocated(By.id('username')),
      defaultConfig.defaultTimeout
    );

    // Find and click the submit button without filling the form
    const submitButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    await submitButton.click();

    // Wait for error messages to appear
    await driver.sleep(500); // Small delay for error messages to render

    // Check for username error message
    const usernameError = await driver.findElement(
      By.xpath("//p[contains(@class, 'nh-error-message') and contains(text(), 'Username is required')]")
    );
    expect(await usernameError.isDisplayed()).toBe(true);

    // Check for password error message
    const passwordError = await driver.findElement(
      By.xpath("//p[contains(@class, 'nh-error-message') and contains(text(), 'Password is required')]")
    );
    expect(await passwordError.isDisplayed()).toBe(true);
  }, 30000);

  it('should toggle password visibility when clicking eye icon', async () => {
    // Navigate to the login page
    await driver.get(`${defaultConfig.baseUrl}/login`);

    // Wait for the password input to load
    const passwordInput = await driver.wait(
      until.elementLocated(By.id('password')),
      defaultConfig.defaultTimeout
    );

    // Check initial password input type
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Find and click the password visibility toggle button
    const toggleButton = await driver.findElement(
      By.xpath("//button[@type='button']//ancestor::button[contains(@class, 'absolute')]")
    );
    await toggleButton.click();

    // Wait a moment for the state to update
    await driver.sleep(200);

    // Check that password is now visible (type="text")
    expect(await passwordInput.getAttribute('type')).toBe('text');

    // Click again to hide password
    await toggleButton.click();
    await driver.sleep(200);

    // Check that password is hidden again
    expect(await passwordInput.getAttribute('type')).toBe('password');
  }, 30000);

  it('should allow typing in username and password fields', async () => {
    // Navigate to the login page
    await driver.get(`${defaultConfig.baseUrl}/login`);

    // Wait for inputs to load
    const usernameInput = await driver.wait(
      until.elementLocated(By.id('username')),
      defaultConfig.defaultTimeout
    );
    const passwordInput = await driver.findElement(By.id('password'));

    // Type test values using working credentials
    await usernameInput.clear();
    await usernameInput.sendKeys(testCredentials.username);

    await passwordInput.clear();
    await passwordInput.sendKeys(testCredentials.password);

    // Verify values were entered
    expect(await usernameInput.getAttribute('value')).toBe(testCredentials.username);
    expect(await passwordInput.getAttribute('value')).toBe(testCredentials.password);
  }, 30000);

  it('should successfully login with valid credentials', async () => {
    // Navigate to the login page
    await driver.get(`${defaultConfig.baseUrl}/login`);

    // Wait for inputs to load
    const usernameInput = await driver.wait(
      until.elementLocated(By.id('username')),
      defaultConfig.defaultTimeout
    );
    const passwordInput = await driver.findElement(By.id('password'));
    const submitButton = await driver.findElement(By.xpath("//button[@type='submit']"));

    // Enter valid credentials
    await usernameInput.clear();
    await usernameInput.sendKeys(testCredentials.username);

    await passwordInput.clear();
    await passwordInput.sendKeys(testCredentials.password);

    // Submit the form
    await submitButton.click();

    // Wait for navigation
    await driver.sleep(2000);

    // Should be redirected away from login page (to home or dashboard)
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).not.toContain('/login');
    
    // Should be on the home page or another authenticated page
    expect(currentUrl === `${defaultConfig.baseUrl}/` || !currentUrl.includes('/login')).toBe(true);
  }, 30000);
});

