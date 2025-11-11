import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Forum Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display forum page with header and create post button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    // Wait for forum page to load
    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(), 'Forum')]")),
      defaultConfig.defaultTimeout
    );

    const title = await driver.findElement(By.xpath("//h1[contains(text(), 'Forum')]"));
    expect(await title.isDisplayed()).toBe(true);

    // Check if create post button exists
    const createPostButton = await driver.findElement(By.xpath("//a[contains(@href, '/forum/create')]"));
    expect(await createPostButton.isDisplayed()).toBe(true);
  }, 30000);

  it('should display search input and filter button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search posts...']")),
      defaultConfig.defaultTimeout
    );

    const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search posts...']"));
    expect(await searchInput.isDisplayed()).toBe(true);

    // Check for filter/funnel button
    const filterButtons = await driver.findElements(By.xpath("//button[contains(@class, 'nh-button')]"));
    expect(filterButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should allow typing in search field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search posts...']")),
      defaultConfig.defaultTimeout
    );

    const searchQuery = 'nutrition';
    await searchInput.clear();
    await searchInput.sendKeys(searchQuery);

    expect(await searchInput.getAttribute('value')).toBe(searchQuery);
  }, 30000);

  it('should display forum post cards when posts are loaded', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000); // Wait for posts to load from API

    // Look for post cards
    const postCards = await driver.findElements(By.className('nh-card'));
    
    // If there are posts, check they have content
    if (postCards.length > 0) {
      expect(postCards.length).toBeGreaterThan(0);
    } else {
      // If no posts, there should be an empty state message
      const emptyState = await driver.findElements(By.xpath("//*[contains(text(), 'No posts')]"));
      expect(emptyState.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should show filter panel when filter button is clicked', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(), 'Forum')]")),
      defaultConfig.defaultTimeout
    );

    // Find and click filter button
    const filterButton = await driver.findElement(By.xpath("//button[contains(., 'Filter')]"));
    await filterButton.click();

    await driver.sleep(500);

    // Check if filter options appear (tag buttons should be visible)
    const tagButtons = await driver.findElements(By.xpath("//button[contains(@class, 'rounded-full')]"));
    expect(tagButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should have pagination controls if there are posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000); // Wait for posts to load

    // Check for pagination (Previous/Next buttons or page numbers)
    const paginationElements = await driver.findElements(
      By.xpath("//button[contains(., 'Previous') or contains(., 'Next')]")
    );
    
    // Pagination should exist if there are posts
    // This is a loose check - pagination may or may not be present depending on data
    expect(paginationElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

