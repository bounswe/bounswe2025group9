import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Nutrient Help Buttons E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display help buttons on nutrient cards', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Search for kidney
    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search for a food...']")),
      defaultConfig.defaultTimeout
    );
    await searchInput.clear();
    await searchInput.sendKeys('kidney');
    
    // Click search button
    const searchButton = await driver.findElement(By.xpath("//button[contains(., 'Search') or @type='submit']"));
    await searchButton.click();
    await driver.sleep(2000);

    // Click on kidney food item
    const kidneyFood = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'kidney') or contains(text(), 'Kidney')]")),
      defaultConfig.defaultTimeout
    );
    await kidneyFood.click();
    await driver.sleep(2000);

    // Scroll down to see micronutrients section
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await driver.sleep(1000);

    // Check for help buttons
    const helpButtons = await driver.findElements(
      By.css('button[title="View daily recommendation"]')
    );
    expect(helpButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should open recommendations modal when help button is clicked', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Search for kidney
    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search for a food...']")),
      defaultConfig.defaultTimeout
    );
    await searchInput.clear();
    await searchInput.sendKeys('kidney');
    
    // Click search button
    const searchButton = await driver.findElement(By.xpath("//button[contains(., 'Search') or @type='submit']"));
    await searchButton.click();
    await driver.sleep(2000);

    // Click on kidney food
    const kidneyFood = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'kidney') or contains(text(), 'Kidney')]")),
      defaultConfig.defaultTimeout
    );
    await kidneyFood.click();
    await driver.sleep(2000);

    // Scroll down to see micronutrients section
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await driver.sleep(1000);

    // Click help button
    const helpButton = await driver.wait(
      until.elementLocated(By.css('button[title="View daily recommendation"]')),
      defaultConfig.defaultTimeout
    );
    await helpButton.click();
    await driver.sleep(2000);

    // Check if modal opened
    const modalTitle = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Daily Recommendation')]")),
      defaultConfig.defaultTimeout
    );
    expect(await modalTitle.isDisplayed()).toBe(true);
  }, 30000);

  it('should display daily target and serving information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Search for kidney
    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search for a food...']")),
      defaultConfig.defaultTimeout
    );
    await searchInput.clear();
    await searchInput.sendKeys('kidney');
    
    // Click search button
    const searchButton = await driver.findElement(By.xpath("//button[contains(., 'Search') or @type='submit']"));
    await searchButton.click();
    await driver.sleep(2000);

    // Click on kidney food
    const kidneyFood = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'kidney') or contains(text(), 'Kidney')]")),
      defaultConfig.defaultTimeout
    );
    await kidneyFood.click();
    await driver.sleep(2000);

    // Scroll down to see micronutrients section
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await driver.sleep(1000);

    // Click help button
    const helpButton = await driver.wait(
      until.elementLocated(By.css('button[title="View daily recommendation"]')),
      defaultConfig.defaultTimeout
    );
    await helpButton.click();
    await driver.sleep(2000);

    // Check for target section
    const targetSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'Your Daily Target')]")
    );
    expect(await targetSection.isDisplayed()).toBe(true);

    // Check for serving section
    const servingSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'This Serving Provides')]")
    );
    expect(await servingSection.isDisplayed()).toBe(true);
  }, 30000);

  it('should close modal when X button is clicked', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Search for kidney
    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search for a food...']")),
      defaultConfig.defaultTimeout
    );
    await searchInput.clear();
    await searchInput.sendKeys('kidney');
    
    // Click search button
    const searchButton = await driver.findElement(By.xpath("//button[contains(., 'Search') or @type='submit']"));
    await searchButton.click();
    await driver.sleep(2000);

    // Click on kidney food
    const kidneyFood = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'kidney') or contains(text(), 'Kidney')]")),
      defaultConfig.defaultTimeout
    );
    await kidneyFood.click();
    await driver.sleep(2000);

    // Scroll down to see micronutrients section
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await driver.sleep(1000);

    // Click help button
    const helpButton = await driver.wait(
      until.elementLocated(By.css('button[title="View daily recommendation"]')),
      defaultConfig.defaultTimeout
    );
    await helpButton.click();
    await driver.sleep(2000);

    // Click close button
    const closeButton = await driver.findElement(By.css('button[class*="absolute"][class*="top-4"]'));
    await closeButton.click();
    await driver.sleep(500);

    // Modal should be closed
    const modals = await driver.findElements(By.xpath("//*[contains(text(), 'Daily Recommendation')]"));
    expect(modals.length).toBe(0);
  }, 30000);
});
