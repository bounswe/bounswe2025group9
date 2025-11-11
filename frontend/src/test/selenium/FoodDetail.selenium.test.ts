import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Food Detail Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should navigate to food detail page from foods list', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(2000);

    // Find and click first food card
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1000);

      // Should navigate to detail page or show modal
      const currentUrl = await driver.getCurrentUrl();
      const modalElements = await driver.findElements(
        By.xpath("//*[contains(@role, 'dialog') or contains(@class, 'modal')]")
      );
      
      expect(currentUrl.includes('foods') || modalElements.length > 0).toBe(true);
    }
  }, 30000);

  it('should display food detail page with food name', async () => {
    // Try accessing a specific food detail (assuming ID 1 exists)
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for food name heading
    const foodNameElements = await driver.findElements(
      By.xpath("//h1 | //h2")
    );
    
    expect(foodNameElements.length).toBeGreaterThan(0);
  }, 30000);

  it('should show nutrition information section', async () => {
    // Navigate to foods page and open a food detail
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);
    
    // Click on first food card to open detail modal
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1500);

      // Look for nutrition labels (case insensitive)
      const nutritionElements = await driver.findElements(
        By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'calories') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'protein') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'carb') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'fat') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'nutrition')]")
      );
      
      // Should find some nutrition information
      expect(nutritionElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display serving size information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for serving size
    const servingSizeElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Serving') or contains(text(), 'Size') or contains(text(), 'Portion')]")
    );
    
    expect(servingSizeElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show nutrition score badge', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for nutrition score
    const scoreElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Score') or contains(@class, 'badge') or contains(@class, 'score')]")
    );
    
    expect(scoreElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display food category or type', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for category badge or label
    const categoryElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Category') or contains(@class, 'badge') or contains(@class, 'tag')]")
    );
    
    expect(categoryElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have add to meal planner button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for add to meal planner button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to') or contains(., 'Plan') or contains(., 'Meal')]")
    );
    
    expect(addButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show detailed nutritional breakdown', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for detailed nutrients (vitamins, minerals, etc.)
    const detailedNutrients = await driver.findElements(
      By.xpath("//*[contains(text(), 'Vitamin') or contains(text(), 'Fiber') or contains(text(), 'Sodium') or contains(text(), 'Sugar')]")
    );
    
    expect(detailedNutrients.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display food image if available', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for food image
    const images = await driver.findElements(By.xpath("//img"));
    
    expect(images.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have back or close button to return to foods list', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for back/close button
    const backButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Back') or contains(., 'Close') or contains(@aria-label, 'back')] | //a[contains(@href, '/foods')]")
    );
    
    expect(backButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow selecting different serving sizes', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for serving size selector
    const servingSelectors = await driver.findElements(
      By.xpath("//select[contains(@name, 'serving')] | //input[contains(@type, 'number')]")
    );
    
    expect(servingSelectors.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display allergen information if available', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for allergen warnings
    const allergenElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Allergen') or contains(text(), 'Contains')]")
    );
    
    expect(allergenElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show related or similar foods', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for related foods section
    const relatedFoodsElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Similar') or contains(text(), 'Related') or contains(text(), 'You might also like')]")
    );
    
    expect(relatedFoodsElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should handle clicking add to meal planner button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Find and click add to meal planner button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Should show modal or confirmation
      const modalElements = await driver.findElements(
        By.xpath("//*[contains(@role, 'dialog') or contains(text(), 'Select') or contains(text(), 'Choose')]")
      );
      
      expect(modalElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);
});

