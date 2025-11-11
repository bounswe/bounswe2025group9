import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Signup Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display signup form with all required fields', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    // Wait for the signup title
    const title = await driver.wait(
      until.elementLocated(By.xpath("//h2[contains(text(), 'Sign Up')]")),
      defaultConfig.defaultTimeout
    );
    expect(await title.isDisplayed()).toBe(true);

    // Check all input fields exist
    const nameInput = await driver.findElement(By.id('name'));
    expect(await nameInput.isDisplayed()).toBe(true);

    const surnameInput = await driver.findElement(By.id('surname'));
    expect(await surnameInput.isDisplayed()).toBe(true);

    const emailInput = await driver.findElement(By.id('email'));
    expect(await emailInput.isDisplayed()).toBe(true);

    const usernameInput = await driver.findElement(By.id('username'));
    expect(await usernameInput.isDisplayed()).toBe(true);

    const passwordInput = await driver.findElement(By.id('password'));
    expect(await passwordInput.isDisplayed()).toBe(true);

    const confirmPasswordInput = await driver.findElement(By.id('confirmPassword'));
    expect(await confirmPasswordInput.isDisplayed()).toBe(true);

    const submitButton = await driver.findElement(By.xpath("//button[@type='submit' and contains(text(), 'Create Account')]"));
    expect(await submitButton.isDisplayed()).toBe(true);
  }, 30000);

  it('should show validation errors for empty form submission', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    await driver.wait(
      until.elementLocated(By.id('name')),
      defaultConfig.defaultTimeout
    );

    // Submit empty form
    const submitButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    await submitButton.click();

    await driver.sleep(500);

    // Check for error messages
    const errorMessages = await driver.findElements(By.className('nh-error-message'));
    expect(errorMessages.length).toBeGreaterThan(0);
  }, 30000);

  it('should show password criteria when typing password', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    const passwordInput = await driver.wait(
      until.elementLocated(By.id('password')),
      defaultConfig.defaultTimeout
    );

    // Focus on password field
    await passwordInput.click();
    await passwordInput.sendKeys('test');

    await driver.sleep(300);

    // Check if password criteria checklist is visible
    const criteriaText = await driver.findElement(By.xpath("//p[contains(text(), 'Password must have:')]"));
    expect(await criteriaText.isDisplayed()).toBe(true);

    // Check for specific criteria
    const minLengthCriteria = await driver.findElement(By.xpath("//*[contains(text(), 'At least 8 characters')]"));
    expect(await minLengthCriteria.isDisplayed()).toBe(true);
  }, 30000);

  it('should validate password match in confirm password field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    const passwordInput = await driver.wait(
      until.elementLocated(By.id('password')),
      defaultConfig.defaultTimeout
    );
    const confirmPasswordInput = await driver.findElement(By.id('confirmPassword'));

    // Type different passwords
    await passwordInput.sendKeys('Test1234');
    await confirmPasswordInput.sendKeys('Test5678');

    await driver.sleep(300);

    // Check for mismatch message
    const mismatchText = await driver.findElement(By.xpath("//*[contains(text(), 'Passwords do not match')]"));
    expect(await mismatchText.isDisplayed()).toBe(true);

    // Now make them match
    await confirmPasswordInput.clear();
    await confirmPasswordInput.sendKeys('Test1234');

    await driver.sleep(300);

    // Check for match message
    const matchText = await driver.findElement(By.xpath("//*[contains(text(), 'Passwords match')]"));
    expect(await matchText.isDisplayed()).toBe(true);
  }, 30000);

  it('should toggle password visibility', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    const passwordInput = await driver.wait(
      until.elementLocated(By.id('password')),
      defaultConfig.defaultTimeout
    );

    // Initial type should be password
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Find and click the toggle button (there are multiple, get the first one for password field)
    const toggleButtons = await driver.findElements(By.xpath("//button[@type='button']"));
    await toggleButtons[0].click();
    await driver.sleep(200);

    // Should now be text
    expect(await passwordInput.getAttribute('type')).toBe('text');

    // Toggle back
    await toggleButtons[0].click();
    await driver.sleep(200);

    expect(await passwordInput.getAttribute('type')).toBe('password');
  }, 30000);

  it('should have a link to login page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/signup`);

    await driver.wait(
      until.elementLocated(By.linkText('Sign in')),
      defaultConfig.defaultTimeout
    );

    const loginLink = await driver.findElement(By.linkText('Sign in'));
    expect(await loginLink.isDisplayed()).toBe(true);
    expect(await loginLink.getAttribute('href')).toContain('/login');
  }, 30000);
});

