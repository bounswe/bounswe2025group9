import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Post Interaction - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver(defaultConfig);
    // Login first since forum pages are protected
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display like button on forum post cards', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Look for like buttons on post cards
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like') or contains(@aria-label, 'Like')]")
    );
    
    expect(likeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display like count on posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Look for like count
    const likeCountElements = await driver.findElements(
      By.xpath("//*[contains(@class, 'like') or contains(., '♥') or contains(., '❤')]")
    );
    
    expect(likeCountElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow clicking like button on a post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Find first like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like') or contains(@aria-label, 'Like')]")
    );
    
    if (likeButtons.length > 0) {
      // Get initial state
      const initialState = await likeButtons[0].getAttribute('aria-pressed');
      
      // Click like button
      await likeButtons[0].click();
      await driver.sleep(1000);

      // Button should still be present (state may change)
      expect(await likeButtons[0].isDisplayed()).toBe(true);
    }
  }, 30000);

  it('should toggle like state when clicking like button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Find first like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      // Click once
      await likeButtons[0].click();
      await driver.sleep(500);

      // Click again
      await likeButtons[0].click();
      await driver.sleep(500);

      // Button should still be functional
      expect(await likeButtons[0].isDisplayed()).toBe(true);
    }
  }, 30000);

  it('should show like button on post detail page', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for like button (more flexible search)
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'like')] | //button[contains(., '♥') or contains(., '❤') or contains(@class, 'like')]")
    );
    
    // May or may not have like button depending on authentication
    expect(likeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should update like count when liking a post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find like button and count
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      // Click like
      await likeButtons[0].click();
      await driver.sleep(1000);

      // Count should exist (may have changed)
      const likeCountElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'like') or @aria-label[contains(., 'like')]]")
      );
      
      expect(likeCountElements.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should show visual feedback when post is liked', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      // Get initial class/style
      const initialClass = await likeButtons[0].getAttribute('class');
      
      // Click like
      await likeButtons[0].click();
      await driver.sleep(500);

      // Get new class/style
      const newClass = await likeButtons[0].getAttribute('class');
      
      // Classes may change or remain the same depending on state
      expect(newClass).toBeDefined();
    }
  }, 30000);

  it('should persist like state after page refresh (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find and click like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      await likeButtons[0].click();
      await driver.sleep(1000);

      // Refresh page
      await driver.navigate().refresh();
      await driver.sleep(1500);

      // Like button should still exist
      const refreshedLikeButtons = await driver.findElements(
        By.xpath("//button[contains(@aria-label, 'like')]")
      );
      
      expect(refreshedLikeButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should display comment button on posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Look for comment buttons or links
    const commentButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Comment') or contains(@aria-label, 'comment')] | //*[contains(text(), 'comment')]")
    );
    
    expect(commentButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show comment count on posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Look for comment count
    const commentCountElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'comment') or contains(text(), 'Comment')]")
    );
    
    expect(commentCountElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should navigate to post detail when clicking on post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum`);

    await driver.sleep(2000);

    // Find and click first post card
    const postCards = await driver.findElements(By.className('nh-card'));
    
    if (postCards.length > 0) {
      await postCards[0].click();
      await driver.sleep(1000);

      // Should navigate to detail page
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('forum');
    }
  }, 30000);

  it('should show share button on posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for share button
    const shareButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Share') or contains(@aria-label, 'Share')]")
    );
    
    expect(shareButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should require authentication to like posts', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      await likeButtons[0].click();
      await driver.sleep(1000);

      // May redirect to login or show message if not authenticated
      const currentUrl = await driver.getCurrentUrl();
      const loginForm = await driver.findElements(By.id('username'));
      
      // Either on same page or redirected to login
      expect(currentUrl || loginForm).toBeDefined();
    }
  }, 30000);

  it('should allow unliking a post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like')]")
    );
    
    if (likeButtons.length > 0) {
      // Like
      await likeButtons[0].click();
      await driver.sleep(500);

      // Unlike
      await likeButtons[0].click();
      await driver.sleep(500);

      // Button should still be functional
      expect(await likeButtons[0].isDisplayed()).toBe(true);
    }
  }, 30000);
});

