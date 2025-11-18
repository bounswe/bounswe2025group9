# Selenium Tests

Browser automation tests that simulate real user interactions.

## Common Commands

**Find elements:**
```typescript
await driver.findElement(By.id('username'))
await driver.findElement(By.css('.button'))
await driver.findElement(By.xpath("//button[text()='Submit']"))
await driver.findElement(By.linkText('Sign up'))
```

**Interact:**
```typescript
await element.click()
await element.sendKeys('text')
await element.clear()
await element.getText()
await element.getAttribute('href')
```

**Wait for things:**
```typescript
await driver.wait(until.elementLocated(By.id('id')), 10000)
await driver.wait(until.elementIsVisible(element), 10000)
```

## Tips

- Use IDs for selectors when possible
- Always wait for elements before interacting
- Check `Login.selenium.test.ts` for examples
- Set `headless: false` in config to watch tests run

