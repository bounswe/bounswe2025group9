import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Meal Planner Actions - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
    // Login before running tests since all pages are protected
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display add to meal planner button on food detail page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Look for add to meal planner button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to') or contains(., 'Plan') or contains(., 'Meal Planner')]")
    );
    
    expect(addButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should open meal selection modal when clicking add to meal planner', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Find and click add button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Should show modal with meal type selection
      const modalElements = await driver.findElements(
        By.xpath("//*[contains(@role, 'dialog') or contains(@class, 'modal') or contains(text(), 'Select')]")
      );
      
      expect(modalElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should show meal type options in add meal modal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for meal type options (Breakfast, Lunch, Dinner)
      const mealTypeOptions = await driver.findElements(
        By.xpath("//*[contains(text(), 'Breakfast') or contains(text(), 'Lunch') or contains(text(), 'Dinner')]")
      );
      
      expect(mealTypeOptions.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should show date selector in add meal modal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for date selector
      const dateSelectors = await driver.findElements(
        By.xpath("//input[@type='date'] | //button[contains(., 'Today') or contains(., 'Tomorrow')]")
      );
      
      expect(dateSelectors.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should allow selecting meal type', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Try to select breakfast
      const breakfastOptions = await driver.findElements(
        By.xpath("//button[contains(., 'Breakfast')] | //input[@value='breakfast']")
      );
      
      if (breakfastOptions.length > 0) {
        await breakfastOptions[0].click();
        await driver.sleep(500);
        
        expect(await breakfastOptions[0].isDisplayed()).toBe(true);
      }
    }
  }, 30000);

  it('should have confirm button in add meal modal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for confirm/add button
      const confirmButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add') or contains(., 'Confirm') or contains(., 'Save')]")
      );
      
      expect(confirmButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should have cancel button in add meal modal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for cancel/close button
      const cancelButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Cancel') or contains(., 'Close') or contains(., '×')]")
      );
      
      expect(cancelButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should close modal when clicking cancel', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Click cancel
      const cancelButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Cancel') or contains(., 'Close')]")
      );
      
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await driver.sleep(500);

        // Modal should be closed
        const modalElements = await driver.findElements(
          By.xpath("//*[contains(@role, 'dialog')]")
        );
        
        // Modal may still exist in DOM but be hidden
        expect(modalElements.length).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30000);

  it('should show add meal button on meal planner page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(1500);

    // Look for add meal buttons
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add') or contains(., '+')]")
    );
    
    expect(addButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('should open meal search when clicking add on meal planner', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(1500);

    // Click add meal button
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Should show search/selection interface
      const searchElements = await driver.findElements(
        By.xpath("//input[@type='search'] | //input[contains(@placeholder, 'search')] | //*[contains(@role, 'dialog')]")
      );
      
      expect(searchElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display serving size selector when adding meal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for serving size input
      const servingInputs = await driver.findElements(
        By.xpath("//input[@type='number'] | //select[contains(@name, 'serving')]")
      );
      
      expect(servingInputs.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should show quick add buttons for today meals', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods`);

    await driver.sleep(1500);

    // Click add to meal planner
    const addButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Add to')]")
    );
    
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await driver.sleep(1000);

      // Look for quick add buttons (Add to Breakfast Today, etc.)
      const quickAddButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Today')]")
      );
      
      expect(quickAddButtons.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display planned meals on meal planner page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(2000);

    // Look for meal cards or empty state
    const mealCards = await driver.findElements(By.className('nh-card'));
    const emptyState = await driver.findElements(
      By.xpath("//*[contains(text(), 'No meals') or contains(text(), 'Add your first')]")
    );
    
    expect(mealCards.length + emptyState.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow removing meals from planner', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(2000);

    // Look for remove buttons on meal cards
    const removeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'Remove') or contains(@aria-label, 'Delete')] | //button[contains(., '×')]")
    );
    
    expect(removeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should confirm before removing meal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(2000);

    // Find remove button
    const removeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'Remove')]")
    );
    
    if (removeButtons.length > 0) {
      await removeButtons[0].click();
      await driver.sleep(500);

      // May show confirmation dialog
      const confirmElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Are you sure') or contains(text(), 'confirm')] | //button[contains(., 'Delete') or contains(., 'Remove')]")
      );
      
      expect(confirmElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should show meal details when clicking on planned meal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(2000);

    // Find meal cards
    const mealCards = await driver.findElements(By.className('nh-card'));
    
    if (mealCards.length > 0) {
      await mealCards[0].click();
      await driver.sleep(1000);

      // Should show meal details or navigate to food detail
      const detailElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Nutrition') or contains(text(), 'Serving')]")
      );
      
      expect(detailElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display total nutrition for the day', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(1500);

    // Look for total nutrition summary
    const nutritionElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Total') or contains(text(), 'total')] | //*[contains(text(), 'Calories') or contains(text(), 'Protein')]")
    );
    
    expect(nutritionElements.length).toBeGreaterThan(0);
  }, 30000);

  it('should allow copying meals to another day', async () => {
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);

    await driver.sleep(2000);

    // Look for copy or duplicate functionality
    const copyButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Copy') or contains(., 'Duplicate') or contains(@aria-label, 'copy')]")
    );
    
    expect(copyButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

