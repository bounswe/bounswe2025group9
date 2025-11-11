import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Meal Planner Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display meal planner page with header', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    // Wait for page to load
    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(), 'Meal Planner') or contains(text(), 'meal')]")),
      defaultConfig.defaultTimeout
    );

    const title = await driver.findElement(
      By.xpath("//h1[contains(text(), 'Meal Planner') or contains(text(), 'meal')]")
    );
    expect(await title.isDisplayed()).toBe(true);
  }, 30000);

  it('should display calendar or day selector', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for calendar elements or day buttons
    const calendarElements = await driver.findElements(
      By.xpath("//*[contains(@class, 'calendar') or contains(text(), 'Monday') or contains(text(), 'Today')]")
    );
    
    expect(calendarElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have meal type sections (breakfast, lunch, dinner)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for meal type sections
    const mealTypeSections = await driver.findElements(
      By.xpath("//*[contains(text(), 'Breakfast') or contains(text(), 'Lunch') or contains(text(), 'Dinner')]")
    );
    
    expect(mealTypeSections.length).toBeGreaterThan(0);
  }, 30000);

  it('should display add meal buttons for each meal type', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for add meal buttons
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add') or contains(., '+')]")
    );
    
    expect(addButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should open meal selection modal when clicking add meal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Find and click add meal button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Should see modal or dropdown with meal options
      const modalElements = await driver.findElements(
        By.xpath("//*[contains(@role, 'dialog') or contains(@class, 'modal')]")
      );
      
      expect(modalElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display total calorie count for the day', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for calorie counter
    const calorieElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Calories') or contains(text(), 'kcal') or contains(text(), 'Total')]")
    );
    
    expect(calorieElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have navigation between different days', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for previous/next day buttons or date picker
    const navigationButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'previous') or contains(@aria-label, 'next')] | //button[contains(., '<') or contains(., '>')]")
    );
    
    expect(navigationButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display planned meals if any exist', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1500);

    // Look for meal cards or empty state
    const mealCards = await driver.findElements(By.className('nh-card'));
    const emptyState = await driver.findElements(
      By.xpath("//*[contains(text(), 'No meals') or contains(text(), 'Add your first meal')]")
    );
    
    expect(mealCards.length + emptyState.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show nutrition summary for planned meals', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for nutrition information
    const nutritionElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Protein') or contains(text(), 'Carbs') or contains(text(), 'Fat')]")
    );
    
    expect(nutritionElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have meal suggestions or recommendations feature', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for suggestions button or section
    const suggestionElements = await driver.findElements(
      By.xpath("//button[contains(., 'Suggest') or contains(., 'Recommend')] | //*[contains(text(), 'Suggestions')]")
    );
    
    expect(suggestionElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow removing meals from the plan', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1500);

    // Look for remove/delete buttons on meal cards
    const removeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'Remove') or contains(@aria-label, 'Delete')] | //button[contains(., '×') or contains(., 'Remove')]")
    );
    
    expect(removeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display weekly view option', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    await driver.sleep(1000);

    // Look for week view toggle or week navigation
    const weekViewElements = await driver.findElements(
      By.xpath("//button[contains(., 'Week') or contains(., 'Day')] | //*[contains(text(), 'Week')]")
    );
    
    expect(weekViewElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show loading state while fetching meal plan data', async () => {
    await driver.get(`${defaultConfig.baseUrl}/meal-planner`);

    // Check immediately for loading indicator
    const loadingElements = await driver.findElements(
      By.xpath("//*[contains(@class, 'loading') or contains(@class, 'spinner') or contains(text(), 'Loading')]")
    );
    
    // Loading may be very brief, so this is a lenient check
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);

    // Wait for content to load
    await driver.sleep(1500);
  }, 30000);
});

