const { test, expect } = require("@playwright/test");

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=AI-Powered Cybersecurity Platform")).toBeVisible();
});
