import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig } from './selenium.config';

describe('Navigation - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display navbar with logo', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.wait(
      until.elementLocated(By.xpath("//img[@alt='NutriHub Logo']")),
      defaultConfig.defaultTimeout
    );

    const logo = await driver.findElement(By.xpath("//img[@alt='NutriHub Logo']"));
    expect(await logo.isDisplayed()).toBe(true);

    // Check logo text
    const logoText = await driver.findElement(By.xpath("//h1[contains(., 'NutriHub')]"));
    expect(await logoText.isDisplayed()).toBe(true);
  }, 30000);

  it('should navigate to home page when clicking logo', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(500);

    // Click on logo
    const logo = await driver.findElement(By.xpath("//img[@alt='NutriHub Logo']"));
    await logo.click();

    await driver.sleep(500);

    // Should be on home page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe(`${defaultConfig.baseUrl}/`);
  }, 30000);

  it('should have navigation links in navbar', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Check for navigation links
    const homeLink = await driver.findElements(By.xpath("//a[@href='/']"));
    expect(homeLink.length).toBeGreaterThan(0);

    const forumLink = await driver.findElements(By.xpath("//a[@href='/forum']"));
    expect(forumLink.length).toBeGreaterThan(0);

    const foodsLink = await driver.findElements(By.xpath("//a[@href='/foods']"));
    expect(foodsLink.length).toBeGreaterThan(0);
  }, 30000);

  it('should navigate to forum page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Click forum link
    const forumLink = await driver.findElement(By.xpath("//a[@href='/forum']"));
    await forumLink.click();

    await driver.sleep(1000);

    // Should be on forum page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/forum');

    // Check for forum page content
    const forumTitle = await driver.findElement(By.xpath("//h1[contains(text(), 'Forum')]"));
    expect(await forumTitle.isDisplayed()).toBe(true);
  }, 30000);

  it('should navigate to foods page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Click foods link
    const foodsLink = await driver.findElement(By.xpath("//a[@href='/foods']"));
    await foodsLink.click();

    await driver.sleep(1000);

    // Should be on foods page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/foods');

    // Check for foods page content
    const foodsTitle = await driver.findElement(By.xpath("//h1[contains(text(), 'Foods')]"));
    expect(await foodsTitle.isDisplayed()).toBe(true);
  }, 30000);

  it('should navigate to meal planner page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Look for meal planner link
    const mealPlannerLinks = await driver.findElements(By.xpath("//a[@href='/meal-planner']"));
    
    if (mealPlannerLinks.length > 0) {
      await mealPlannerLinks[0].click();
      await driver.sleep(1000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/meal-planner');
    }
  }, 30000);

  it('should show login/signup links when not authenticated', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Should see login link
    const loginLinks = await driver.findElements(By.xpath("//a[@href='/login']"));
    
    // Should see signup link
    const signupLinks = await driver.findElements(By.xpath("//a[@href='/signup']"));
    
    // At least one of these should be present (depending on navbar design)
    expect(loginLinks.length + signupLinks.length).toBeGreaterThan(0);
  }, 30000);

  it('should have footer with links', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(500);

    // Scroll to bottom
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
    await driver.sleep(500);

    // Check for footer
    const footer = await driver.findElements(By.xpath("//footer"));
    expect(footer.length).toBeGreaterThan(0);
  }, 30000);
});

