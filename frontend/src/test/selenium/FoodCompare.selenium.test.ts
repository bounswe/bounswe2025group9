import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import { getDriver, quitDriver, defaultConfig, loginWithTestCredentials } from './selenium.config';

describe('Food Compare - Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await getDriver();
    await loginWithTestCredentials(driver);
  }, 30000);

  afterAll(async () => {
    await quitDriver(driver);
  });

  // Helper to open selector, search and click a food by name (partial match allowed)
  async function selectFoodByName(name: string) {
    // Click Add Foods
    const addBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Add Foods')]")),
      defaultConfig.defaultTimeout
    );
    await addBtn.click();

    // Wait for search input
    const searchInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Search foods...']")),
      defaultConfig.defaultTimeout
    );

    // Enter search term
    await searchInput.clear();
    await searchInput.sendKeys(name);

    // Wait a bit for debounce + API
    await driver.sleep(1200);

    // Try to locate a card that contains the name (prefer exact, fallback to partial)
    let card;
    try {
      card = await driver.findElement(By.xpath(`//div[contains(@class,'nh-card') and .//h3[contains(normalize-space(.), '${name}')]]`));
    } catch (e) {
      const short = name.split(' ')[0];
      card = await driver.findElement(By.xpath(`//div[contains(@class,'nh-card') and .//h3[contains(., '${short}')]]`));
    }

    await card.click();

    // allow dialog to close and selection to propagate
    await driver.sleep(800);
  }

  it('0 - shows hint when no foods selected', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/compare`);

    // Wait for central hint card
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Select at least two foods to start comparing')]")),
      defaultConfig.defaultTimeout
    );

    const hint = await driver.findElement(By.xpath("//*[contains(text(), 'Select at least two foods to start comparing')]"));
    expect(await hint.isDisplayed()).toBe(true);
  }, 30000);

  it('1 - selecting same food twice shows duplicate alert', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/compare`);

    // Select a food (Bulgur)
    await selectFoodByName('Bulgur (Cooked)');

    // Open selector again and try to select the same food
    await selectFoodByName('Bulgur (Cooked)');

    // Expect an alert indicating duplicate selection
    await driver.wait(until.alertIsPresent(), defaultConfig.defaultTimeout);
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();
    expect(alertText).toMatch(/already selected for comparison/i);
    await alert.accept();
  }, 30000);

  it('2 - selecting two foods renders comparison successfully', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/compare`);

    // Select two foods
    await selectFoodByName('Bulgur (Cooked)');
    await selectFoodByName('Millet (Cooked)');

    // Wait for comparison card to appear
    await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(., 'Macronutrients (per 100 g)')]")),
      defaultConfig.defaultTimeout
    );

    const heading = await driver.findElement(By.xpath("//h3[contains(., 'Macronutrients (per 100 g)')]"));
    expect(await heading.isDisplayed()).toBe(true);
  }, 40000);

  it('3 - selecting three foods renders comparison successfully', async () => {
    await driver.get(`${defaultConfig.baseUrl}/foods/compare`);

    // Select three foods
    await selectFoodByName('Bulgur (Cooked)');
    await selectFoodByName('Millet (Cooked)');
    await selectFoodByName('Cooked Lentils');

    // Wait for comparison card to appear
    await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(., 'Macronutrients (per 100 g)')]")),
      defaultConfig.defaultTimeout
    );

    const heading = await driver.findElement(By.xpath("//h3[contains(., 'Macronutrients (per 100 g)')]"));
    expect(await heading.isDisplayed()).toBe(true);
  }, 40000);
});
