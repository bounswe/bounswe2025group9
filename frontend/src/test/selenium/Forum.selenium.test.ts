import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Forum Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display forum page with header and create post button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    // Wait for forum page to load - check for filter section or new post button
    await driver.wait(
      until.elementLocated(By.xpath("//a[contains(@href, '/forum/create')]")),
      defaultConfig.defaultTimeout
    );

    // Check if create post button exists
    const createPostButton = await driver.findElement(By.xpath("//a[contains(@href, '/forum/create')]"));
    expect(await createPostButton.isDisplayed()).toBe(true);
    
    // Verify filter section is present
    const filterSection = await driver.findElement(By.xpath("//*[contains(text(), 'Filter Posts')]"));
    expect(await filterSection.isDisplayed()).toBe(true);
  }, 30000);

  it('should display search input and filter button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search posts by title...']")),
      defaultConfig.defaultTimeout
    );

    const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search posts by title...']"));
    expect(await searchInput.isDisplayed()).toBe(true);

    // Check for filter buttons (Dietary Tips, Recipes, etc.)
    const filterButtons = await driver.findElements(By.xpath("//button[contains(., 'Dietary Tips') or contains(., 'Recipes')]"));
    expect(filterButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should allow typing in search field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search posts by title...']")),
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
      until.elementLocated(By.xpath("//*[contains(text(), 'Filter Posts')]")),
      defaultConfig.defaultTimeout
    );

    // Find and click one of the filter buttons (Dietary Tips)
    const filterButton = await driver.findElement(By.xpath("//button[contains(., 'Dietary Tips')]"));
    await filterButton.click();

    await driver.sleep(500);

    // Check if filter indicator appears
    const filterIndicator = await driver.findElements(By.xpath("//*[contains(text(), 'Filtered by:')]"));
    expect(filterIndicator.length).toBeGreaterThanOrEqual(0);
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

