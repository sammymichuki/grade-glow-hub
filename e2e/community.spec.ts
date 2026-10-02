import { test, expect } from '@playwright/test';

test.describe('Community & Peer Review E2E Journey', () => {
  test('navigates to community dashboard and filters discussion questions', async ({ page }) => {
    await page.goto('/#/community');
    await expect(page.locator('text=Discussions Active').first()).toBeVisible();
    await expect(page.locator('text=Verified Solutions').first()).toBeVisible();

    // Check Start Discussion button
    const askBtn = page.locator('button:has-text("Ask Question"), button:has-text("Start Discussion")');
    await expect(askBtn.first()).toBeVisible();
  });

  test('switches to Peer Review studio', async ({ page }) => {
    await page.goto('/#/community');
    const peerTab = page.locator('button:has-text("Peer Review")').first();
    await peerTab.click();
    await expect(page.locator('text=Double-Blind Peer Review Studio').first()).toBeVisible();
  });
});
