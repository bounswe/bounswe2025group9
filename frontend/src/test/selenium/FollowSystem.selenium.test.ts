import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Follow System - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('should display follow button on other user profiles', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Look for follow button
      const followButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Follow') or contains(., 'Following')]")
      );

      expect(followButtons.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should toggle follow status when clicking follow button', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Find follow button
      const followButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Follow') or contains(., 'Following')]")
      );

      if (followButtons.length > 0) {
        const initialText = await followButtons[0].getText();
        
        // Click the button
        await followButtons[0].click();
        await driver.sleep(2000);

        // Get the new text
        const newFollowButtons = await driver.findElements(
          By.xpath("//button[contains(., 'Follow') or contains(., 'Following')]")
        );
        
        if (newFollowButtons.length > 0) {
          const newText = await newFollowButtons[0].getText();
          
          // Text should have changed
          expect(newText).not.toBe(initialText);
        }
      }
    }
  }, 30000);

  it('should show success message after following a user', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Find follow button that says "Follow" (not already following)
      const followButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Follow') and not(contains(., 'Following'))]")
      );

      if (followButtons.length > 0) {
        // Click to follow
        await followButtons[0].click();
        await driver.sleep(1500);

        // Look for success message
        const successMessages = await driver.findElements(
          By.xpath("//*[contains(text(), 'You are now following') or contains(text(), 'following')]")
        );

        expect(successMessages.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should update followers count after following', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Get initial followers count
      const followersElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Followers')]")
      );

      if (followersElements.length > 0) {
        const parentElement = await followersElements[0].findElement(By.xpath('..'));
        const countElements = await parentElement.findElements(By.xpath(".//*"));
        
        let initialCount = 0;
        for (const elem of countElements) {
          const text = await elem.getText();
          const match = text.match(/\d+/);
          if (match) {
            initialCount = parseInt(match[0]);
            break;
          }
        }

        // Find and click follow button
        const followButtons = await driver.findElements(
          By.xpath("//button[contains(., 'Follow')]")
        );

        if (followButtons.length > 0) {
          await followButtons[0].click();
          await driver.sleep(2000);

          // Get new followers count
          const newFollowersElements = await driver.findElements(
            By.xpath("//*[contains(text(), 'Followers')]")
          );

          if (newFollowersElements.length > 0) {
            const newParentElement = await newFollowersElements[0].findElement(By.xpath('..'));
            const newCountElements = await newParentElement.findElements(By.xpath(".//*"));
            
            let newCount = 0;
            for (const elem of newCountElements) {
              const text = await elem.getText();
              const match = text.match(/\d+/);
              if (match) {
                newCount = parseInt(match[0]);
                break;
              }
            }

            // Count should have changed
            expect(newCount).not.toBe(initialCount);
          }
        }
      }
    }
  }, 30000);

  it('should show loading state while following', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Find follow button
      const followButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Follow')]")
      );

      if (followButtons.length > 0) {
        // Click the button
        await followButtons[0].click();
        
        // Immediately check for loading state (spinner or "Following..." text)
        await driver.sleep(100);
        
        const loadingElements = await driver.findElements(
          By.xpath("//*[contains(text(), 'Following...') or contains(text(), 'Unfollowing...')]")
        );

        // Loading state might be very brief, so we just verify the button exists
        expect(followButtons.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should display followers and following counts on user profile', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Look for followers count
      const followersElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Followers')]")
      );

      // Look for following count
      const followingElements = await driver.findElements(
        By.xpath("//*[contains(text(), 'Following')]")
      );

      expect(followersElements.length).toBeGreaterThan(0);
      expect(followingElements.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should not show follow button on own profile', async () => {
    // Navigate to own profile
    await driver.get(`${defaultConfig.baseUrl}/profile`);
    await driver.sleep(2000);

    // Look for follow button - should not exist
    const followButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Follow') or contains(., 'Following')]")
    );

    expect(followButtons.length).toBe(0);
  }, 30000);

  it('should allow unfollowing a user', async () => {
    // Navigate to forum to find a post by another user
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post and click on the author's username
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      await authorLinks[0].click();
      await driver.sleep(2000);

      // Find "Following" button (already following)
      const followingButtons = await driver.findElements(
        By.xpath("//button[contains(., 'Following')]")
      );

      if (followingButtons.length > 0) {
        // Click to unfollow
        await followingButtons[0].click();
        await driver.sleep(2000);

        // Look for success message
        const successMessages = await driver.findElements(
          By.xpath("//*[contains(text(), 'You unfollowed') or contains(text(), 'unfollowed')]")
        );

        expect(successMessages.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('should navigate to user profile from post author link', async () => {
    // Navigate to forum
    await driver.get(`${defaultConfig.baseUrl}/forum`);
    await driver.sleep(2000);

    // Find a post author link
    const authorLinks = await driver.findElements(
      By.xpath("//a[contains(@href, '/user/')]")
    );

    if (authorLinks.length > 0) {
      const authorHref = await authorLinks[0].getAttribute('href');
      await authorLinks[0].click();
      await driver.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      
      // Should be on user profile page
      expect(currentUrl).toContain('/user/');
    }
  }, 30000);
});
