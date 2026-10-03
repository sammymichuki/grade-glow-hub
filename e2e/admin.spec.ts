import { test, expect } from '@playwright/test';

test.describe('Administrative Control Center E2E Flow', () => {
  test('loads the control center and exposes every governance tab', async ({ page }) => {
    await page.goto('/#/admin');

    await expect(page.locator('text=Enterprise Administration').first()).toBeVisible();
    await expect(page.locator('text=Control Center').first()).toBeVisible();

    const overviewTab = page.locator('button[role="tab"]:has-text("Overview")');
    const usersTab = page.locator('button[role="tab"]:has-text("User Accounts")');
    const coursesTab = page.locator('button[role="tab"]:has-text("Course Oversight")');
    const healthTab = page.locator('button[role="tab"]:has-text("System Health")');
    const settingsTab = page.locator('button[role="tab"]:has-text("Platform Policies")');

    await expect(overviewTab).toBeVisible();
    await expect(usersTab).toBeVisible();
    await expect(coursesTab).toBeVisible();
    await expect(healthTab).toBeVisible();
    await expect(settingsTab).toBeVisible();
  });

  test('renders platform KPI cards and institutional analytics', async ({ page }) => {
    await page.goto('/#/admin');

    await expect(page.locator('text=Total Users').first()).toBeVisible();
    await expect(page.locator('text=Curriculum Courses').first()).toBeVisible();
    await expect(page.locator('text=Total Enrollments').first()).toBeVisible();
    await expect(page.locator('text=System Availability').first()).toBeVisible();

    await expect(page.locator('text=Institutional Growth & Quiz Completions')).toBeVisible();
    await expect(page.locator('text=Department Distribution')).toBeVisible();
  });

  test('manages user accounts and RBAC roles', async ({ page }) => {
    await page.goto('/#/admin');
    await page.locator('button[role="tab"]:has-text("User Accounts")').click();

    await expect(page.locator('text=User Accounts & Access Directory')).toBeVisible();
    await expect(page.locator('text=Jane Doe').first()).toBeVisible();

    // Filter the directory down to teaching assistants only.
    await page.locator('select[aria-label="Filter by Role"]').selectOption('ta');
    await expect(page.locator('text=Alex Rivera').first()).toBeVisible();
    await expect(page.locator('text=Jane Doe')).toHaveCount(0);
  });

  test('oversees curriculum catalog publication status', async ({ page }) => {
    await page.goto('/#/admin');
    await page.locator('button[role="tab"]:has-text("Course Oversight")').click();

    await expect(page.locator('text=Curriculum Catalog & Course Oversight')).toBeVisible();
    await expect(page.locator('text=Mathematics Fundamentals').first()).toBeVisible();

    await page.locator('select[aria-label="Filter by Course Status"]').selectOption('archived');
    await expect(page.locator('text=Classical Literature & Poetry').first()).toBeVisible();
  });

  test('inspects the immutable audit trail and diagnostics', async ({ page }) => {
    await page.goto('/#/admin');
    await page.locator('button[role="tab"]:has-text("System Health")').click();

    await expect(page.locator('text=Institutional Security & Audit Trail')).toBeVisible();
    await expect(page.locator('text=SECURITY_ALERT').first()).toBeVisible();

    // Open the detail inspector for a critical event.
    await page.locator('tr', { hasText: 'SECURITY_ALERT' }).locator('button:has-text("Inspect")').click();
    await expect(page.locator('text=Audit Event Details')).toBeVisible();
  });

  test('toggles platform maintenance mode policy', async ({ page }) => {
    await page.goto('/#/admin');
    await page.locator('button[role="tab"]:has-text("Platform Policies")').click();

    await expect(page.locator('text=Institutional Identity & Contact')).toBeVisible();
    await expect(page.locator('text=Maintenance Mode Is Active')).toHaveCount(0);

    await page.locator('button[aria-label="Toggle Maintenance Mode"]').click();
    await expect(page.locator('text=Maintenance Mode Is Active').first()).toBeVisible();
  });

  test('is reachable from the primary navigation', async ({ page }) => {
    await page.goto('/#/');

    const adminLink = page.locator('nav a[href="#/admin"]').first();
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    await expect(page.locator('text=Enterprise Administration').first()).toBeVisible();
  });
});
