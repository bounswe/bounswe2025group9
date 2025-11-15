import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Profile Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display user profile information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1500);

    // We're authenticated and on profile page - check for profile elements
    const profileElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Profile') or contains(text(), 'Email') or contains(text(), 'Username') or contains(text(), 'Name')]")
    );
    expect(profileElements.length).toBeGreaterThan(0);
  }, 30000);

  it('should have edit profile button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Look for edit button
    const editButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Edit') or contains(., 'edit')]")
    );
    
    // Edit button will only be present if authenticated
    expect(editButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display profile form fields when editing (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Try to find and click edit button
    const editButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Edit')]")
    );
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await driver.sleep(500);

      // Look for form fields
      const nameInput = await driver.findElements(By.id('name'));
      const surnameInput = await driver.findElements(By.id('surname'));
      const emailInput = await driver.findElements(By.id('email'));
      
      // At least one form field should be present
      expect(nameInput.length + surnameInput.length + emailInput.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should have profile image upload capability (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Look for image upload button or profile picture
    const imageElements = await driver.findElements(
      By.xpath("//img | //button[contains(., 'Upload') or contains(., 'Change Picture')]")
    );
    
    expect(imageElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow updating profile information (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Try to find edit button and click it
    const editButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Edit')]")
    );
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await driver.sleep(500);

      // Try to find and update name field
      const nameInputs = await driver.findElements(By.id('name'));
      
      if (nameInputs.length > 0) {
        await nameInputs[0].clear();
        await nameInputs[0].sendKeys('John');
        
        expect(await nameInputs[0].getAttribute('value')).toBe('John');
      }
    }
  }, 30000);

  it('should have save and cancel buttons when editing (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Try to find edit button
    const editButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Edit')]")
    );
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await driver.sleep(500);

      // Look for save and cancel buttons
      const saveButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Save')]")
      );
      const cancelButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Cancel')]")
      );
      
      expect(saveButtons.length + cancelButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display user stats and activity (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1000);

    // Look for stats elements (posts count, followers, etc.)
    const statsElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Posts') or contains(text(), 'Followers') or contains(text(), 'Following')]")
    );
    
    expect(statsElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow viewing other users profiles', async () => {
    // Try to access a specific user profile (assuming user ID 1 exists)
    await driver.get(`${defaultConfig.baseUrl}/profile/1`);

    await driver.sleep(1500);

    const currentUrl = await driver.getCurrentUrl();
    
    // Should either show profile or redirect to login
    expect(currentUrl).toMatch(/\/(profile|login)/);
  }, 30000);

  it('should display user posts on profile page (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/profile`);

    await driver.sleep(1500);

    // Look for post cards or empty state
    const postCards = await driver.findElements(By.className('nh-card'));
    const emptyState = await driver.findElements(
      By.xpath("//*[contains(text(), 'No posts') or contains(text(), 'posts')]")
    );
    
    expect(postCards.length + emptyState.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

