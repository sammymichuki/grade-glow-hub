import { test, expect } from '@playwright/test';

test.describe('Authentication & User Profile E2E Journey', () => {
  test('navigates to login page and displays form fields', async ({ page }) => {
    await page.goto('/#/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('navigates to register page and validates signup inputs', async ({ page }) => {
    await page.goto('/#/register');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('navbar reflects auth actions and links', async ({ page }) => {
    await page.goto('/#/');
    const loginLink = page.locator('a[href="#/login"]').first();
    const signupLink = page.locator('a[href="#/register"]').first();
    await expect(loginLink).toBeVisible();
    await expect(signupLink).toBeVisible();
  });
});
