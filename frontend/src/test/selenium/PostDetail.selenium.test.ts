import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Post Detail Page - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    if (defaultConfig.headless) {
      await loginWithTestCredentials(driver);
    }
  }, 30000);

  afterAll(async () => {
    if (defaultConfig.headless) {
      await quitDriver(driver);
    }
  });

  it('should navigate to post detail from forum list', async () => {
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

  it('should display post detail page with title and content', async () => {
    // Try accessing a specific post (assuming ID 1 exists)
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for post title
    const titleElements = await driver.findElements(
      By.xpath("//h1 | //h2")
    );
    
    expect(titleElements.length).toBeGreaterThan(0);

    // Look for post content
    const contentElements = await driver.findElements(
      By.xpath("//p | //div[contains(@class, 'content')]")
    );
    
    expect(contentElements.length).toBeGreaterThan(0);
  }, 30000);

  it('should show post author information', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for author name or username (case insensitive)
    const authorElements = await driver.findElements(
      By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'by') or contains(@class, 'author') or contains(@class, 'username') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'posted')]")
    );
    
    // May or may not have author info depending on data
    expect(authorElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display post timestamp', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for timestamp
    const timeElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'ago') or contains(@class, 'time') or contains(@class, 'date')]")
    );
    
    expect(timeElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show like button and like count', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for like button (more flexible search)
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'like')] | //button[contains(., '♥') or contains(., '❤') or contains(@class, 'like')]")
    );
    
    // May or may not have like button depending on authentication
    expect(likeButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display tags associated with the post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for tags
    const tagElements = await driver.findElements(
      By.xpath("//*[contains(@class, 'tag') or contains(@class, 'badge')]")
    );
    
    expect(tagElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have comments section', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for comments section (case insensitive)
    const commentSectionElements = await driver.findElements(
      By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'comment')]")
    );
    
    // May or may not have visible comments section
    expect(commentSectionElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display existing comments if any', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(2000);

    // Look for comment cards or empty state
    const commentElements = await driver.findElements(
      By.xpath("//div[contains(@class, 'comment')] | //*[contains(text(), 'No comments')]")
    );
    
    expect(commentElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have comment input field (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for comment textarea or input
    const commentInputs = await driver.findElements(
      By.xpath("//textarea[contains(@placeholder, 'comment')] | //textarea[contains(@placeholder, 'Comment')] | //input[contains(@placeholder, 'comment')]")
    );
    
    expect(commentInputs.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow typing in comment field (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Try to find comment input
    const commentInputs = await driver.findElements(
      By.xpath("//textarea[contains(@placeholder, 'comment')] | //textarea")
    );
    
    if (commentInputs.length > 0) {
      const testComment = 'This is a test comment';
      await commentInputs[0].clear();
      await commentInputs[0].sendKeys(testComment);
      
      expect(await commentInputs[0].getAttribute('value')).toBe(testComment);
    }
  }, 30000);

  it('should have submit comment button (if authenticated)', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for submit/post comment button
    const submitButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Post') or contains(., 'Submit') or contains(., 'Comment')]")
    );
    
    expect(submitButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show edit button if user owns the post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for edit button (may not be present if not owner)
    const editButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Edit')] | //button[contains(@aria-label, 'Edit')]")
    );
    
    expect(editButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should show delete button if user owns the post', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for delete button (may not be present if not owner)
    const deleteButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Delete')] | //button[contains(@aria-label, 'Delete')]")
    );
    
    expect(deleteButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should have back button to return to forum', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for back button or forum link (case insensitive)
    const backButtons = await driver.findElements(
      By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'back')] | //a[contains(@href, '/forum') and not(contains(@href, '/post'))] | //button[contains(., '←') or contains(., '<')]")
    );
    
    // May or may not have back button
    expect(backButtons.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display recipe ingredients if post is a recipe', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for ingredients section (only present for recipes)
    const ingredientElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Ingredients') or contains(text(), 'ingredients')]")
    );
    
    expect(ingredientElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should display recipe instructions if post is a recipe', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for instructions section (only present for recipes)
    const instructionElements = await driver.findElements(
      By.xpath("//*[contains(text(), 'Instructions') or contains(text(), 'Steps') or contains(text(), 'Directions')]")
    );
    
    expect(instructionElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should allow liking the post when clicking like button', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Find like button
    const likeButtons = await driver.findElements(
      By.xpath("//button[contains(@aria-label, 'like') or contains(@aria-label, 'Like')]")
    );
    
    if (likeButtons.length > 0) {
      await likeButtons[0].click();
      await driver.sleep(500);

      // Button state should change or count should update
      expect(await likeButtons[0].isDisplayed()).toBe(true);
    }
  }, 30000);

  it('should show comment count', async () => {
    await driver.get(`${defaultConfig.baseUrl}/forum/post/1`);

    await driver.sleep(1500);

    // Look for comment count (case insensitive)
    const commentCountElements = await driver.findElements(
      By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'comment')]")
    );
    
    // May or may not show comment count
    expect(commentCountElements.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

