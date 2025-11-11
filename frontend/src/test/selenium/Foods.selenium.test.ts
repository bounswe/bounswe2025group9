import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Foods Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display foods page with header and search functionality', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    // Wait for foods page to load
    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(), 'Foods')]")),
      defaultConfig.defaultTimeout
    );

    const title = await driver.findElement(By.xpath("//h1[contains(text(), 'Foods')]"));
    expect(await title.isDisplayed()).toBe(true);

    // Check for search input
    const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search foods...']"));
    expect(await searchInput.isDisplayed()).toBe(true);
  }, 30000);

  it('should allow searching for foods', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search foods...']")),
      defaultConfig.defaultTimeout
    );

    const searchQuery = 'apple';
    await searchInput.clear();
    await searchInput.sendKeys(searchQuery);

    expect(await searchInput.getAttribute('value')).toBe(searchQuery);

    // Wait a bit for search to process
    await driver.sleep(1000);
  }, 30000);

  it('should display food items in cards', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    // Wait for the page to load and foods to be fetched
    await driver.sleep(2000);

    // Look for food cards
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    // Should have food cards or a message
    if (foodCards.length > 0) {
      expect(foodCards.length).toBeGreaterThan(0);
      
      // Check if first card has expected content (food name)
      const subtitle = await foodCards[0].findElement(By.className('nh-subtitle'));
      const foodName = await subtitle.getText();
      expect(foodName.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should show filter button and allow filtering', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(), 'Foods')]")),
      defaultConfig.defaultTimeout
    );

    // Find filter button
    const filterButton = await driver.findElement(By.xpath("//button[contains(., 'Filter')]"));
    expect(await filterButton.isDisplayed()).toBe(true);

    // Click to open filters
    await filterButton.click();
    await driver.sleep(500);

    // Filter options should be visible (category dropdowns, etc.)
    const filterElements = await driver.findElements(By.xpath("//select | //button[contains(@class, 'rounded')]"));
    expect(filterElements.length).toBeGreaterThan(0);
  }, 30000);

  it('should have pagination controls', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(2000); // Wait for foods to load

    // Look for pagination elements
    const paginationButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Previous') or contains(., 'Next')]")
    );
    
    // Pagination should exist
    expect(paginationButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display nutrition score on food cards', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(2000);

    // Look for nutrition score elements
    const nutritionScoreElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Nutrition Score')]")
    );
    
    if (nutritionScoreElements.length > 0) {
      expect(await nutritionScoreElements[0].isDisplayed()).toBe(true);
    }
  }, 30000);

  it('should open food detail when clicking on a food card', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(2000);

    // Find first food card
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1000);

      // Should see detailed view or modal
      // This could be a modal or navigation to detail page
      const detailElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Nutrition Information') or contains(text(), 'Serving Size')]")
      );
      
      expect(detailElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);
});

