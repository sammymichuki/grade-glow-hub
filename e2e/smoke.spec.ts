import { test, expect } from '@playwright/test';

test.describe('Grade Glow Hub Smoke Suite', () => {
  test('landing page loads and displays core navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Grade Glow Hub|Vite|React/i);
    
    // Check for navigation elements
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('courses catalog page navigation', async ({ page }) => {
    await page.goto('/#/courses');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
