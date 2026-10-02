import { test, expect } from '@playwright/test';

test.describe('Course Catalog & Lesson Navigation E2E Journey', () => {
  test('browses courses catalog and searches for subjects', async ({ page }) => {
    await page.goto('/#/courses');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Math');
      await page.waitForTimeout(300);
    }
  });

  test('views course details syllabus and lesson outlines', async ({ page }) => {
    await page.goto('/#/course/1');
    await expect(page.locator('text=Mathematics').first()).toBeVisible();
    await expect(page.locator('a[href*="/lessons/"]').first()).toBeVisible();
  });

  test('navigates to specific lesson and displays offline toggle and quiz callout', async ({ page }) => {
    await page.goto('/#/course/1/lessons/1');
    await expect(page.locator('text=Lesson 1').first()).toBeVisible();

    // Check offline button exists
    const offlineBtn = page.locator('button:has-text("Save for Offline"), button:has-text("Available Offline")');
    await expect(offlineBtn).toBeVisible();

    // Check checkpoint quiz callout exists
    const quizCallout = page.locator('text=Take Checkpoint Quiz, text=Lesson Assessment');
    await expect(quizCallout.first()).toBeVisible();
  });
});
