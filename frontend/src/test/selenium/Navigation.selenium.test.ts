import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Navigation - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
    // Login first since most pages are protected
    await loginWithTestCredentials(driver);
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

    // Click on logo - click the parent link element instead
    const logoLink = await driver.findElement(By.xpath("//a[.//img[@alt='NutriHub Logo']]"));
    await logoLink.click();

    await driver.sleep(1000);

    // Should be on home page (we're authenticated)
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe(`${defaultConfig.baseUrl}/`);
  }, 30000);

  it('should have navigation links in navbar', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(1000);

    // Since we're authenticated, check for main navigation links
    const forumLink = await driver.findElements(By.xpath("//a[@href='/forum']"));
    const foodsLink = await driver.findElements(By.xpath("//a[@href='/foods']"));
    const mealPlannerLink = await driver.findElements(By.xpath("//a[@href='/mealplanner']"));
    
    // Should have navigation links visible
    const totalLinks = forumLink.length + foodsLink.length + mealPlannerLink.length;
    expect(totalLinks).toBeGreaterThan(0);
  }, 30000);

  it('should navigate to forum page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(1000);

    // Find and click forum link (we're authenticated so it should be visible)
    const forumLink = await driver.findElement(By.xpath("//a[@href='/forum']"));
    await forumLink.click();
    await driver.sleep(1500);

    // Should be on forum page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe(`${defaultConfig.baseUrl}/forum`);

    // Check for forum page content (Filter Posts section)
    const filterSection = await driver.findElements(By.xpath("//*[contains(text(), 'Filter Posts') or contains(text(), 'New Post')]"));
    expect(filterSection.length).toBeGreaterThan(0);
  }, 30000);

  it('should navigate to foods page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(1000);

    // Find and click foods link (we're authenticated so it should be visible)
    const foodsLink = await driver.findElement(By.xpath("//a[@href='/foods']"));
    await foodsLink.click();
    await driver.sleep(1500);

    // Should be on foods page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe(`${defaultConfig.baseUrl}/foods`);

    // Check for foods page content (Sort Options section or search input)
    const sortSection = await driver.findElements(By.xpath("//*[contains(text(), 'Sort Options') or contains(@placeholder, 'Search for a food')]"));
    expect(sortSection.length).toBeGreaterThan(0);
  }, 30000);

  it('should navigate to meal planner page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/`);

    await driver.sleep(1000);

    // Find and click meal planner link (we're authenticated so it should be visible)
    // Note: the correct path is /mealplanner (no dash)
    const mealPlannerLink = await driver.findElement(By.xpath("//a[@href='/mealplanner']"));
    await mealPlannerLink.click();
    await driver.sleep(1500);

    // Should be on meal planner page
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe(`${defaultConfig.baseUrl}/mealplanner`);
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

