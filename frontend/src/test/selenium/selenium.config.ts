import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export interface SeleniumConfig {
  browser: Browser;
  headless: boolean;
  baseUrl: string;
  defaultTimeout: number;
}

export const defaultConfig: SeleniumConfig = {
  browser: Browser.CHROME,
  headless: true,
  baseUrl: 'http://localhost:5173', // Vite default dev server port
  defaultTimeout: 10000,
};

export async function createDriver(config: SeleniumConfig = defaultConfig): Promise<WebDriver> {
  const options = new chrome.Options();
  
  if (config.headless) {
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
  }
  
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  
  const driver = await new Builder()
    .forBrowser(config.browser)
    .setChromeOptions(options)
    .build();
  
  await driver.manage().setTimeouts({ implicit: config.defaultTimeout });
  
  return driver;
}

export async function quitDriver(driver: WebDriver): Promise<void> {
  if (driver) {
    await driver.quit();
  }
}

