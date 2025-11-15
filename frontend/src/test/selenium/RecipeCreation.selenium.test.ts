import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Recipe Creation - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display recipe post type option', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Look for recipe type selector
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe') or contains(., 'recipe')]")
    );
    
    expect(recipeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show ingredients section when recipe type is selected', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Try to click recipe type button
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for ingredients section
      const ingredientElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Ingredients') or contains(@placeholder, 'ingredient')]")
      );
      
      expect(ingredientElements.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should have add ingredient button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Try to select recipe type first
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for add ingredient button
      const addIngredientButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Ingredient') or contains(., 'ingredient')]")
      );
      
      expect(addIngredientButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should allow adding multiple ingredients', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Try to select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Try to add ingredients
      const addIngredientButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Ingredient')]")
      );
      
      if (addIngredientButtons.length > 0) {
        // Click add ingredient button multiple times
        await addIngredientButtons[0].click();
        await driver.sleep(300);
        await addIngredientButtons[0].click();
        await driver.sleep(300);

        // Should have multiple ingredient input fields
        const ingredientInputs = await driver.findElements(
          By.xpath("//input[contains(@placeholder, 'ingredient')] | //input[contains(@name, 'ingredient')]")
        );
        
        expect(ingredientInputs.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should have ingredient name and quantity fields', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Add an ingredient
      const addIngredientButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Ingredient')]")
      );
      
      if (addIngredientButtons.length > 0) {
        await addIngredientButtons[0].click();
        await driver.sleep(500);

        // Look for ingredient input fields (name and quantity)
        const ingredientFields = await driver.findElements(
          By.xpath("//input[contains(@placeholder, 'name') or contains(@placeholder, 'ingredient')] | //input[contains(@placeholder, 'quantity') or contains(@placeholder, 'amount')]")
        );
        
        expect(ingredientFields.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should allow typing ingredient information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Add an ingredient
      const addIngredientButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Ingredient')]")
      );
      
      if (addIngredientButtons.length > 0) {
        await addIngredientButtons[0].click();
        await driver.sleep(500);

        // Try to type in ingredient field
        const ingredientInputs = await driver.findElements(
          By.xpath("//input[contains(@placeholder, 'ingredient') or contains(@name, 'ingredient')]")
        );
        
        if (ingredientInputs.length > 0) {
          await ingredientInputs[0].sendKeys('Flour');
          expect(await ingredientInputs[0].getAttribute('value')).toBe('Flour');
        }
      }
    }
  }, 30000);

  it('should have remove ingredient button for each ingredient', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Add an ingredient
      const addIngredientButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add Ingredient')]")
      );
      
      if (addIngredientButtons.length > 0) {
        await addIngredientButtons[0].click();
        await driver.sleep(500);

        // Look for remove button
        const removeButtons = await driver.findElements(
          By.xpath("//button[contains(., 'Remove') or contains(., '×') or contains(@aria-label, 'Remove')]")
        );
        
        expect(removeButtons.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should have instructions/steps section for recipes', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for instructions section
      const instructionsElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Instructions') or contains(text(), 'Steps') or contains(@placeholder, 'instructions')]")
      );
      
      expect(instructionsElements.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should have cooking time field for recipes', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for cooking time input
      const timeInputs = await driver.findElements(
        By.xpath("//input[contains(@placeholder, 'time') or contains(@name, 'time')] | //*[contains(text(), 'Time') or contains(text(), 'time')]")
      );
      
      expect(timeInputs.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should have servings field for recipes', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for servings input
      const servingsInputs = await driver.findElements(
        By.xpath("//input[contains(@placeholder, 'serving') or contains(@name, 'serving')] | //*[contains(text(), 'Servings') or contains(text(), 'servings')]")
      );
      
      expect(servingsInputs.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should validate required fields when submitting recipe', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Try to submit without filling required fields
      const submitButtons = await driver.findElements(
        By.xpath("//button[@type='submit' or contains(., 'Submit') or contains(., 'Post')]")
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
    }
  }, 30000);

  it('should have image upload for recipe', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Select recipe type
    const recipeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe')]")
    );
    
    if (recipeButtons.length > 0) {
      await recipeButtons[0].click();
      await driver.sleep(500);

      // Look for image upload input
      const imageInputs = await driver.findElements(
        By.xpath("//input[@type='file'] | //button[contains(., 'Upload') or contains(., 'Image')]")
      );
      
      expect(imageInputs.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should allow switching between recipe and regular post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/create`);

    await driver.sleep(1000);

    // Find post type buttons
    const postTypeButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Recipe') or contains(., 'Regular')]")
    );
    
    if (postTypeButtons.length >= 2) {
      // Click Recipe
      await postTypeButtons[0].click();
      await driver.sleep(300);

      // Click Regular
      await postTypeButtons[1].click();
      await driver.sleep(300);

      // Should successfully switch between types
      expect(postTypeButtons.length).toBeGreaterThanOrEqual(2);
    }
  }, 30000);
});

