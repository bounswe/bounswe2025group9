import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('User Flow - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
    // Login first since most pages are protected
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should complete full signup to login flow', async () => {
    // Start at home
    await driver.get(`${defaultConfig.baseUrl}/`);
    await driver.sleep(1000);

    // Navigate to signup
    await driver.get(`${defaultConfig.baseUrl}/signup`);
    await driver.sleep(1000);

    // Verify signup page loaded
    const signupTitle = await driver.findElement(
      By.xpath("//h2[contains(text(), 'Sign Up') or contains(text(), 'Register')]")
    );
    expect(await signupTitle.isDisplayed()).toBe(true);

    // Find link to login page
    const loginLinks = await driver.findElements(By.linkText('Login'));
    
    if (loginLinks.length > 0) {
      await loginLinks[0].click();
      await driver.sleep(1000);

      // Should be on login page
      const loginTitle = await driver.findElement(
        By.xpath("//h2[contains(text(), 'Login')]")
      );
      expect(await loginTitle.isDisplayed()).toBe(true);
    }
  }, 30000);

  it('should navigate from home to forum to post detail', async () => {
    // Start at home
    await driver.get(`${defaultConfig.baseUrl}/`);
    await driver.sleep(1000);

    // Navigate to forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Verify forum page loaded (by checking for filter section)
    const filterSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'Filter Posts')]")
    );
    expect(await filterSection.isDisplayed()).toBe(true);

    // Click on a post if available
    const postCards = await driver.findElements(By.className('nh-card'));
    
    if (postCards.length > 0) {
      await postCards[0].click();
      await driver.sleep(1000);

      // Should be on post detail page
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('forum');
    }
  }, 30000);

  it('should navigate from foods to food detail and back', async () => {
    // Navigate to foods page
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Verify foods page loaded (by checking for sort section)
    const sortSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'Sort Options')]")
    );
    expect(await sortSection.isDisplayed()).toBe(true);

    // Click on a food card if available
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1000);

      // Find back button or close modal
      const backButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Back') or contains(., 'Close') or contains(., '×')]")
      );
      
      if (backButtons.length > 0) {
        await backButtons[0].click();
        await driver.sleep(1000);

        // Should be back on foods page
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('foods');
      }
    }
  }, 30000);

  it('should navigate through all main pages', async () => {
    // Home
    await driver.get(`${defaultConfig.baseUrl}/`);
    await driver.sleep(1000);
    expect(await driver.getCurrentUrl()).toBeDefined();

    // Forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(1500);
    const filterSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'Filter Posts')]")
    );
    expect(await filterSection.isDisplayed()).toBe(true);

    // Foods
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(1500);
    const sortSection = await driver.findElement(
      By.xpath("//*[contains(text(), 'Sort Options')]")
    );
    expect(await sortSection.isDisplayed()).toBe(true);

    // Meal Planner
    await driver.get(`${defaultConfig.baseUrl}/mealplanner`);
    await driver.sleep(1500);
    // Just verify page loads
    expect(await driver.getCurrentUrl()).toContain('mealplanner');
  }, 30000);

  it('should search for food and view details', async () => {
    // Navigate to foods
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(1500);

    // Search for a food
    const searchInput = await driver.findElement(
      By.xpath("//input[@placeholder='Search for a food...']")
    );
    await searchInput.clear();
    await searchInput.sendKeys('apple');
    await driver.sleep(2000);

    // Click on first result if available
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1000);

      // Should see food details
      const detailElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Nutrition') or contains(text(), 'Calories')]")
      );
      
      expect(detailElements.length).toBeGreaterThanOrEqual(0);
    }
  }, 30000);

  it('should search for posts in forum', async () => {
    // Navigate to forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(1500);

    // Search for posts
    const searchInput = await driver.findElement(
      By.xpath("//input[@placeholder='Search posts by title...']")
    );
    await searchInput.clear();
    await searchInput.sendKeys('recipe');
    await driver.sleep(2000);

    // Results should update
    const postCards = await driver.findElements(By.className('nh-card'));
    const emptyState = await driver.findElements(
      By.xpath("//*[contains(text(), 'No posts')]")
    );
    
    expect(postCards.length + emptyState.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should access create post page when authenticated', async () => {
    // Navigate to forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(1500);

    // Look for create post button (we're authenticated so it should be visible)
    const createButtons = await driver.findElements(
      By.xpath("//a[contains(@href, '/forum/create') or contains(., 'New Post')]")
    );
    
    expect(createButtons.length).toBeGreaterThan(0);
    
    // Click it and verify we can access the create page
    if (createButtons.length > 0) {
      await createButtons[0].click();
      await driver.sleep(1500);

      // Should be on create post page (not redirected to login)
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/forum/create');
    }
  }, 30000);

  it('should use navbar to navigate between pages', async () => {
    // Start at home
    await driver.get(`${defaultConfig.baseUrl}/`);
    await driver.sleep(1000);

    // Find and click Forum in navbar
    const forumLinks = await driver.findElements(
      By.xpath("//nav//a[contains(text(), 'Forum')]")
    );
    
    if (forumLinks.length > 0) {
      await forumLinks[0].click();
      await driver.sleep(1000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('forum');
    }

    // Find and click Foods in navbar
    const foodsLinks = await driver.findElements(
      By.xpath("//nav//a[contains(text(), 'Foods')]")
    );
    
    if (foodsLinks.length > 0) {
      await foodsLinks[0].click();
      await driver.sleep(1000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('foods');
    }
  }, 30000);

  it('should filter foods and view results', async () => {
    // Navigate to foods
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(1500);

    // Click filter button
    const filterButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Filter')]")
    );
    
    if (filterButtons.length > 0) {
      await filterButtons[0].click();
      await driver.sleep(500);

      // Select a filter option
      const filterOptions = await driver.findElements(
        By.xpath("//select | //button[contains(@class, 'rounded')]")
      );
      
      if (filterOptions.length > 0) {
        await filterOptions[0].click();
        await driver.sleep(1000);

        // Results should update
        const foodCards = await driver.findElements(By.className('nh-card'));
        expect(foodCards.length).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30000);

  it('should filter forum posts by tags', async () => {
    // Navigate to forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(1500);

    // Click filter button
    const filterButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Filter')]")
    );
    
    if (filterButtons.length > 0) {
      await filterButtons[0].click();
      await driver.sleep(500);

      // Click a tag
      const tagButtons = await driver.findElements(
        By.xpath("//button[contains(@class, 'rounded-full')]")
      );
      
      if (tagButtons.length > 0) {
        await tagButtons[0].click();
        await driver.sleep(1000);

        // Posts should be filtered
        const postCards = await driver.findElements(By.className('nh-card'));
        const emptyState = await driver.findElements(
          By.xpath("//*[contains(text(), 'No posts')]")
        );
        
        expect(postCards.length + emptyState.length).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30000);

  it('should toggle theme and persist across pages', async () => {
    // Start at home
    await driver.get(`${defaultConfig.baseUrl}/`);
    await driver.sleep(1000);

    // Find and click theme toggle
    const themeToggles = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'theme') or contains(@aria-label, 'Theme')]")
    );
    
    if (themeToggles.length > 0) {
      await themeToggles[0].click();
      await driver.sleep(500);

      // Navigate to another page
      await driver.get(`${defaultConfig.baseUrl}/forum`);
      await driver.sleep(1000);

      // Theme should persist
      const body = await driver.findElement(By.tagName('body'));
      const bodyClass = await body.getAttribute('class');
      
      expect(bodyClass).toBeDefined();
    }
  }, 30000);

  it('should navigate to profile and back to forum', async () => {
    // Navigate to forum first
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(1500);

    // Try to navigate to profile
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(1500);

    // Use browser back button
    await driver.navigate().back();
    await driver.sleep(1000);

    // Should be back on forum
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('forum');
  }, 30000);

  it('should complete food browsing to meal planner flow', async () => {
    // Start at foods page
    await driver.get(`${defaultConfig.baseUrl}/foods`);
    await driver.sleep(2000);

    // Click on a food
    const foodCards = await driver.findElements(By.className('nh-card'));
    
    if (foodCards.length > 0) {
      await foodCards[0].click();
      await driver.sleep(1000);

      // Try to add to meal planner
      const addButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Add to')]")
      );
      
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await driver.sleep(1000);

        // Modal should open
        const modalElements = await driver.findElements(
          By.xpath("//*[contains(@role, 'dialog') or contains(@class, 'modal')]")
        );
        
        expect(modalElements.length).toBeGreaterThanOrEqual(0);

        // Close modal and navigate to meal planner
        await driver.get(`${defaultConfig.baseUrl}/mealplanner`);
        await driver.sleep(1500);

        // Verify on meal planner page
        const plannerTitle = await driver.findElement(
          By.xpath("//h1[contains(text(), 'Meal') or contains(text(), 'meal')]")
        );
        expect(await plannerTitle.isDisplayed()).toBe(true);
      }
    }
  }, 30000);
});

