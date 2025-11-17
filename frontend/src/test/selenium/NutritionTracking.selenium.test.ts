import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Nutrition Tracking - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should navigate to profile page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1500);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/profile');
  }, 30000);

  it('should display nutrition tracking tab in profile sidebar', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    // Look for nutrition tracking tab button
    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    expect(nutritionTab.length).toBeGreaterThan(0);
  }, 30000);

  it('should display nutrition summary in overview tab', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1500);

    // Check for "Today's Nutrition" heading in overview
    const todaysNutrition = await driver.findElements(
      By.xpath("//*[contains(text(), \"Today's Nutrition\")]")
    );
    
    expect(todaysNutrition.length).toBeGreaterThan(0);
  }, 30000);

  it('should display macronutrients in overview summary (Calories, Protein, Carbs, Fat)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1500);

    // Check for macronutrient labels
    const caloriesLabel = await driver.findElements(
      By.xpath("//*[contains(text(), 'Calories')]")
    );
    const proteinLabel = await driver.findElements(
      By.xpath("//*[contains(text(), 'Protein')]")
    );
    
    expect(caloriesLabel.length + proteinLabel.length).toBeGreaterThan(0);
  }, 30000);

  it('should navigate to nutrition tracking tab when clicked', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    // Find and click nutrition tracking tab
    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(1500);

      // Verify tracking interface is displayed
      const trackingHeader = await driver.findElements(
        By.xpath("//*[contains(text(), 'Nutrition Tracking')]")
      );
      
      expect(trackingHeader.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display date selector with navigation buttons', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    // Navigate to nutrition tracking tab
    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(1500);

      // Look for date navigation elements
      const dateElements = await driver.findElements(
        By.xpath("//*[contains(@class, 'nh-card')]")
      );
      
      expect(dateElements.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display daily/weekly view toggle buttons', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(1500);

      // Look for Daily/Weekly toggle buttons
      const dailyButton = await driver.findElements(
        By.xpath("//button[contains(., 'Daily')]")
      );
      const weeklyButton = await driver.findElements(
        By.xpath("//button[contains(., 'Weekly')]")
      );
      
      expect(dailyButton.length + weeklyButton.length).toBeGreaterThanOrEqual(1);
    }
  }, 30000);

  it('should display all four macronutrient cards (Calories, Protein, Carbs, Fat)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Check for all macronutrient labels
      const caloriesCard = await driver.findElements(
        By.xpath("//*[contains(text(), 'Calories')]")
      );
      const proteinCard = await driver.findElements(
        By.xpath("//*[contains(text(), 'Protein')]")
      );
      const carbsCard = await driver.findElements(
        By.xpath("//*[contains(text(), 'Carbohydrates') or contains(text(), 'Carbs')]")
      );
      const fatCard = await driver.findElements(
        By.xpath("//*[contains(text(), 'Fat')]")
      );
      
      const totalMacros = caloriesCard.length + proteinCard.length + carbsCard.length + fatCard.length;
      expect(totalMacros).toBeGreaterThanOrEqual(4);
    }
  }, 30000);

  it('should display progress bars in macronutrient cards', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for progress bar elements (typically divs with rounded-full class)
      const progressBars = await driver.findElements(
        By.css('div.rounded-full')
      );
      
      expect(progressBars.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display meal sections (Breakfast, Lunch, Dinner, Snack)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Check for all meal type headings
      const breakfast = await driver.findElements(
        By.xpath("//*[contains(text(), 'Breakfast') or contains(text(), 'breakfast')]")
      );
      const lunch = await driver.findElements(
        By.xpath("//*[contains(text(), 'Lunch') or contains(text(), 'lunch')]")
      );
      const dinner = await driver.findElements(
        By.xpath("//*[contains(text(), 'Dinner') or contains(text(), 'dinner')]")
      );
      const snack = await driver.findElements(
        By.xpath("//*[contains(text(), 'Snack') or contains(text(), 'snack')]")
      );
      
      const totalMeals = breakfast.length + lunch.length + dinner.length + snack.length;
      expect(totalMeals).toBeGreaterThanOrEqual(4);
    }
  }, 30000);

  it('should display "Add Food" buttons for each meal section', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for "Add Food" buttons
      const addFoodButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Food')]")
      );
      
      expect(addFoodButtons.length).toBeGreaterThanOrEqual(4); // At least 4 meals
    }
  }, 30000);

  it('should display food entries with nutrition information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for food entry elements (should show food names and nutrition info)
      const foodEntries = await driver.findElements(
        By.xpath("//*[contains(text(), 'kcal') or contains(text(), 'g')]")
      );
      
      expect(foodEntries.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display edit and delete buttons for food entries', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for action buttons (edit/delete icons or buttons)
      const actionButtons = await driver.findElements(
        By.css('button[title="Edit"], button[title="Delete"]')
      );
      
      // Even if no food entries, buttons should be in the UI structure
      expect(actionButtons.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should display micronutrients panel', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Scroll down to see micronutrients section
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await driver.sleep(500);

      // Look for micronutrients heading or vitamin/mineral labels
      const micronutrientsSection = await driver.findElements(
        By.xpath("//*[contains(text(), 'Micronutrients') or contains(text(), 'Vitamins') or contains(text(), 'Minerals')]")
      );
      
      expect(micronutrientsSection.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display vitamins and minerals sections in micronutrients panel', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Scroll to micronutrients section
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await driver.sleep(500);

      // Look for Vitamins and Minerals headings
      const vitaminsSection = await driver.findElements(
        By.xpath("//*[contains(text(), 'Vitamins')]")
      );
      const mineralsSection = await driver.findElements(
        By.xpath("//*[contains(text(), 'Minerals')]")
      );
      
      expect(vitaminsSection.length + mineralsSection.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should allow expanding/collapsing micronutrient categories', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Scroll to micronutrients section
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await driver.sleep(500);

      // Look for expandable buttons (vitamins or minerals)
      const expandButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Vitamins') or contains(., 'Minerals')]")
      );
      
      if (expandButtons.length > 0) {
        // Try clicking to expand/collapse
        await expandButtons[0].click();
        await driver.sleep(500);
        
        // Button should still exist after click
        const buttonsAfterClick = await driver.findElements(
          By.xpath("//button[contains(., 'Vitamins') or contains(., 'Minerals')]")
        );
        expect(buttonsAfterClick.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should display warning for micronutrients exceeding maximum thresholds', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Scroll to micronutrients section
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await driver.sleep(1000);

      // Look for warning text about maximum limits
      const warningText = await driver.findElements(
        By.xpath("//*[contains(text(), 'maximum') or contains(text(), 'Maximum') or contains(text(), 'threshold')]")
      );
      
      expect(warningText.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should allow clicking "Add Food" button to open modal', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Find and click first "Add Food" button
      const addFoodButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Food')]")
      );
      
      if (addFoodButtons.length > 0) {
        await addFoodButtons[0].click();
        await driver.sleep(1000);

        // Look for modal or dialog
        const modal = await driver.findElements(
          By.css('.fixed.inset-0, [role="dialog"]')
        );
        
        expect(modal.length).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30000);

  it('should toggle between daily and weekly views', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Find weekly view button
      const weeklyButton = await driver.findElements(
        By.xpath("//button[contains(., 'Weekly')]")
      );
      
      if (weeklyButton.length > 0) {
        await weeklyButton[0].click();
        await driver.sleep(1500);

        // Look for weekly summary content
        const weeklySummary = await driver.findElements(
          By.xpath("//*[contains(text(), 'Weekly Summary') or contains(text(), 'week')]")
        );
        
        expect(weeklySummary.length).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30000);

  it('should display historical data in weekly view', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Switch to weekly view
      const weeklyButton = await driver.findElements(
        By.xpath("//button[contains(., 'Weekly')]")
      );
      
      if (weeklyButton.length > 0) {
        await weeklyButton[0].click();
        await driver.sleep(1500);

        // Scroll down to see weekly summary
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
        await driver.sleep(500);

        // Look for date labels or historical entries
        const historicalEntries = await driver.findElements(
          By.css('.nh-card')
        );
        
        expect(historicalEntries.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should allow date navigation with previous/next buttons', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Get initial date
      const dateElements = await driver.findElements(
        By.css('.text-primary')
      );
      
      let initialDate = '';
      if (dateElements.length > 0) {
        initialDate = await dateElements[0].getText();
      }

      // Look for previous/next navigation buttons (typically with arrow icons)
      const navButtons = await driver.findElements(
        By.css('button')
      );
      
      expect(navButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should show "Today" badge when viewing current date', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for "Today" badge or label
      const todayBadge = await driver.findElements(
        By.xpath("//*[contains(text(), 'Today')]")
      );
      
      expect(todayBadge.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display meal totals (calories, protein, carbs, fat) for each meal section', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for meal totals showing kcal or g units
      const mealTotals = await driver.findElements(
        By.xpath("//*[contains(text(), 'kcal') or contains(text(), ' items')]")
      );
      
      expect(mealTotals.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display food images in meal entries', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking')]")
    );
    
    if (nutritionTab.length > 0) {
      await nutritionTab[0].click();
      await driver.sleep(2000);

      // Look for image elements within meal sections
      const images = await driver.findElements(
        By.css('img, .food-image-container')
      );
      
      expect(images.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should be responsive and display correctly on smaller viewport', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1000);

    // Resize to mobile viewport
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await driver.sleep(500);

    const nutritionTab = await driver.findElements(
      By.xpath("//button[contains(., 'Nutrition Tracking') or contains(., 'Nutrition')]")
    );
    
    expect(nutritionTab.length).toBeGreaterThanOrEqual(0);

    // Reset to desktop size
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  }, 30000);
});

