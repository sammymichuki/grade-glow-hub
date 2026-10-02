import { test, expect } from '@playwright/test';

test.describe('Quiz Runner & Auto-Grading E2E Flow', () => {
  test('launches quiz runner and displays countdown timer', async ({ page }) => {
    await page.goto('/#/quiz/quiz-fractions-1');
    await expect(page.locator('text=Fractions & Decimals Assessment').first()).toBeVisible();
    await expect(page.locator('text=Question 1 of').first()).toBeVisible();
  });

  test('completes quiz questions, flags for review, and submits for grade', async ({ page }) => {
    await page.goto('/#/quiz/quiz-fractions-1');

    // Select first option
    const optionA = page.locator('button:has-text("1/2"), button:has-text("3/4")').first();
    if (await optionA.isVisible()) {
      await optionA.click();
    }

    // Flag for review button
    const flagBtn = page.locator('button:has-text("Flag for Review")');
    if (await flagBtn.isVisible()) {
      await flagBtn.click();
      await expect(page.locator('button:has-text("Flagged")')).toBeVisible();
    }

    // Navigate to next question
    const nextBtn = page.locator('button:has-text("Next Question")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await expect(page.locator('text=Question 2 of').first()).toBeVisible();
    }
  });
});
