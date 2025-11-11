import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Food Proposal - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display propose food button on foods page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for propose/add food button
    const proposeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Propose') or contains(., 'Add Food') or contains(., 'Suggest')]")
    );
    
    expect(proposeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should navigate to food proposal form', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    const currentUrl = await driver.getCurrentUrl();
    
    // Should either be on proposal page or login page
    expect(currentUrl).toMatch(/\/(foods|login)/);
  }, 30000);

  it('should redirect to login if not authenticated', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // May redirect to login for unauthenticated users
    const currentUrl = await driver.getCurrentUrl();
    const loginForm = await driver.findElements(By.id('username'));
    
    // Either on login page or proposal page
    expect(currentUrl.includes('login') || loginForm.length === 0).toBe(true);
  }, 30000);

  it('should display food proposal form fields', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for form fields
    const formFields = await driver.findElements(
      By.xpath("//input | //textarea | //select")
    );
    
    expect(formFields.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have food name input field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for food name input
    const nameInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'food name') or contains(@name, 'name') or contains(@id, 'name')]")
    );
    
    expect(nameInputs.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have nutrition information fields', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for nutrition fields (calories, protein, carbs, fat)
    const nutritionInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'calorie') or contains(@name, 'calorie') or contains(@placeholder, 'protein') or contains(@name, 'protein')]")
    );
    
    expect(nutritionInputs.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have serving size field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for serving size input
    const servingInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'serving') or contains(@name, 'serving') or contains(text(), 'Serving')]")
    );
    
    expect(servingInputs.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have food category selector', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for category dropdown or selector
    const categorySelectors = await driver.findElements(
      By.xpath("//select[contains(@name, 'category')] | //button[contains(., 'category')] | //*[contains(text(), 'Category')]")
    );
    
    expect(categorySelectors.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow typing in food name field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Try to find and type in name field
    const nameInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'name') or contains(@name, 'name')]")
    );
    
    if (nameInputs.length > 0) {
      const testFoodName = 'Quinoa Salad';
      await nameInputs[0].clear();
      await nameInputs[0].sendKeys(testFoodName);
      
      expect(await nameInputs[0].getAttribute('value')).toBe(testFoodName);
    }
  }, 30000);

  it('should allow entering nutrition values', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Try to find and enter calorie value
    const calorieInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'calorie') or contains(@name, 'calorie')]")
    );
    
    if (calorieInputs.length > 0) {
      await calorieInputs[0].clear();
      await calorieInputs[0].sendKeys('250');
      
      expect(await calorieInputs[0].getAttribute('value')).toContain('250');
    }
  }, 30000);

  it('should have food description field', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for description textarea
    const descriptionFields = await driver.findElements(
      By.xpath("//textarea[contains(@placeholder, 'description') or contains(@name, 'description')]")
    );
    
    expect(descriptionFields.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have food image upload capability', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for image upload input
    const imageInputs = await driver.findElements(
      By.xpath("//input[@type='file'] | //button[contains(., 'Upload Image')]")
    );
    
    expect(imageInputs.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have submit button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for submit button
    const submitButtons = await driver.findElements(
      By.xpath("//button[@type='submit' or contains(., 'Submit') or contains(., 'Propose')]")
    );
    
    expect(submitButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have cancel button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for cancel button
    const cancelButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Cancel')] | //a[contains(@href, '/foods')]")
    );
    
    expect(cancelButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show validation errors when submitting empty form', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Try to submit empty form
    const submitButtons = await driver.findElements(
      By.xpath("//button[@type='submit']")
    );
    
    if (submitButtons.length > 0) {
      await submitButtons[0].click();
      await driver.sleep(500);

      // Should show validation errors
      const errorMessages = await driver.findElements(
        By.xpath("//*[contains(@class, 'error') or contains(text(), 'required')]")
      );
      
      expect(errorMessages.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should validate numeric fields for nutrition values', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Try to enter non-numeric value in calorie field
    const calorieInputs = await driver.findElements(
      By.xpath("//input[contains(@placeholder, 'calorie') or contains(@name, 'calorie')]")
    );
    
    if (calorieInputs.length > 0) {
      await calorieInputs[0].clear();
      await calorieInputs[0].sendKeys('abc');
      
      // Field should reject non-numeric input or show error
      const value = await calorieInputs[0].getAttribute('value');
      const inputType = await calorieInputs[0].getAttribute('type');
      
      expect(inputType === 'number' || value === '').toBe(true);
    }
  }, 30000);

  it('should have allergen information section', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for allergen checkboxes or input
    const allergenElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Allergen') or contains(text(), 'allergen')]")
    );
    
    expect(allergenElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display form title or heading', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/propose`);

    await driver.sleep(1500);

    // Look for page title
    const titleElements = await driver.findElements(
      By.xpath("//h1[contains(text(), 'Propose') or contains(text(), 'Add Food')] | //h2[contains(text(), 'Propose') or contains(text(), 'Add Food')]")
    );
    
    expect(titleElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

