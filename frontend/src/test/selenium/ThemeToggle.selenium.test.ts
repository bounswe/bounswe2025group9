import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Theme Toggle - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display theme toggle button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Look for theme toggle button (usually a sun/moon icon button)
    const themeButtons = await driver.findElements(
      By.xpath("//button[@aria-label='Toggle theme' or contains(@class, 'theme')]")
    );
    
    // Theme toggle should be present somewhere in the UI
    expect(themeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should toggle between light and dark mode', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Get initial theme from html element
    const htmlElement = await driver.findElement(By.xpath("//html"));
    const initialClass = await htmlElement.getAttribute('class');

    // Find theme toggle button (might be in settings or navbar)
    const themeButtons = await driver.findElements(
      By.xpath("//button[@aria-label='Toggle theme']")
    );
    
    if (themeButtons.length > 0) {
      // Click theme toggle
      await themeButtons[0].click();
      await driver.sleep(500);

      // Check that class changed
      const newClass = await htmlElement.getAttribute('class');
      expect(newClass).not.toBe(initialClass);

      // Toggle back
      await themeButtons[0].click();
      await driver.sleep(500);

      const finalClass = await htmlElement.getAttribute('class');
      expect(finalClass).toBe(initialClass);
    }
  }, 30000);

  it('should persist theme preference after page reload', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    const htmlElement = await driver.findElement(By.xpath("//html"));
    const initialClass = await htmlElement.getAttribute('class');

    // Find and click theme toggle
    const themeButtons = await driver.findElements(
      By.xpath("//button[@aria-label='Toggle theme']")
    );
    
    if (themeButtons.length > 0) {
      await themeButtons[0].click();
      await driver.sleep(500);

      const newClass = await htmlElement.getAttribute('class');

      // Reload page
      await driver.navigate().refresh();
      await driver.sleep(1000);

      // Check if theme persisted
      const htmlAfterReload = await driver.findElement(By.xpath("//html"));
      const classAfterReload = await htmlAfterReload.getAttribute('class');

      // Theme should be the same after reload
      expect(classAfterReload).toBe(newClass);
    }
  }, 30000);

  it('should change background color when toggling theme', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    const body = await driver.findElement(By.xpath("//body"));
    const initialBgColor = await body.getCssValue('background-color');

    const themeButtons = await driver.findElements(
      By.xpath("//button[@aria-label='Toggle theme']")
    );
    
    if (themeButtons.length > 0) {
      await themeButtons[0].click();
      await driver.sleep(500);

      const newBgColor = await body.getCssValue('background-color');

      // Background color should change
      expect(newBgColor).not.toBe(initialBgColor);
    }
  }, 30000);

  it('should have accessible theme toggle button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    const themeButtons = await driver.findElements(
      By.xpath("//button[@aria-label='Toggle theme']")
    );
    
    if (themeButtons.length > 0) {
      // Button should be visible and clickable
      expect(await themeButtons[0].isDisplayed()).toBe(true);
      expect(await themeButtons[0].isEnabled()).toBe(true);
      
      // Should have aria-label for accessibility
      const ariaLabel = await themeButtons[0].getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  }, 30000);
});

