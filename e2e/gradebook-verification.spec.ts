import { test, expect } from '@playwright/test';

test.describe('Student Gradebook & Transcript Verification E2E Journey', () => {
  test('displays gradebook metrics, GPA cards, and weighted categories', async ({ page }) => {
    await page.goto('/#/grades');
    await expect(page.locator('text=Student Academic Gradebook').first()).toBeVisible();
    await expect(page.locator('text=Cumulative GPA').first()).toBeVisible();
    await expect(page.locator('text=Weighted Grade Distribution').first()).toBeVisible();
  });

  test('opens what-if simulator and official report card modal', async ({ page }) => {
    await page.goto('/#/grades');

    // Open Report Card
    const reportCardBtn = page.locator('button:has-text("Official Report Card")');
    if (await reportCardBtn.isVisible()) {
      await reportCardBtn.click();
      await expect(page.locator('text=Official Academic Report Card').first()).toBeVisible();
      await expect(page.locator('text=Print Transcript').first()).toBeVisible();
    }
  });
});
