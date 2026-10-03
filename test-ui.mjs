import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "admin@bunkyo.org.br");
  await page.fill('input[type="password"]', "Admin123!");
  await page.click('button[type="submit"]');

  // Wait for navigation to /admin
  await page.waitForURL("**/admin**");

  // Wait a little for rendering
  await page.waitForTimeout(2000);

  // Extract rows from table
  const rowCount = await page.locator("tbody tr").count();
  console.log(`Found ${rowCount} rows in the table on /admin.`);

  await browser.close();
})();
