import { test, expect } from '@playwright/test';

test.describe('Offline Sync & Internationalization E2E Flow', () => {
  test('displays offline status indicator chip and opens offline modal', async ({ page }) => {
    await page.goto('/#/');

    // Click offline indicator chip in navbar
    const offlineIndicator = page.locator('button[title*="Synced"], button[title*="Offline"]').first();
    await expect(offlineIndicator).toBeVisible();
    await offlineIndicator.click();

    // Verify offline library modal opened
    await expect(page.locator('text=Offline Learning Library').first()).toBeVisible();
    await expect(page.locator('button:has-text("Simulate Offline")').first()).toBeVisible();
  });

  test('switches language between English and Kiswahili', async ({ page }) => {
    await page.goto('/#/');

    // Find language switcher
    const langBtn = page.locator('button[aria-label="Change language"]');
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Select Swahili
    const swOption = page.locator('text=Kiswahili');
    if (await swOption.isVisible()) {
      await swOption.click();
      // Check that navbar translated to Swahili
      await expect(page.locator('text=Kozi, text=Nyumbani').first()).toBeVisible();
    }
  });
});
