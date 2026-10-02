import { test, expect } from '@playwright/test';

test.describe('Instructor Studio & Curriculum Management E2E Flow', () => {
  test('navigates to instructor dashboard and switches studio tabs', async ({ page }) => {
    await page.goto('/#/instructor');

    // Check tabs
    const curriculumTab = page.locator('button[role="tab"]:has-text("Curriculum Studio")');
    const rubricsTab = page.locator('button[role="tab"]:has-text("Grading & Rubrics")');
    const rosterTab = page.locator('button[role="tab"]:has-text("Student Rostering")');

    await expect(curriculumTab).toBeVisible();
    await expect(rubricsTab).toBeVisible();
    await expect(rosterTab).toBeVisible();

    // Switch to Rubrics
    await rubricsTab.click();
    await expect(page.locator('text=Assignment Submissions & Rubrics').first()).toBeVisible();

    // Switch to Rostering
    await rosterTab.click();
    await expect(page.locator('text=Course Student Rostering').first()).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
  });
});
