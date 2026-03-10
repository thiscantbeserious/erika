/**
 * Visual regression tests for the gallery page (LandingPage).
 * Covers empty state, populated state, skeleton loading, and reduced-motion.
 *
 * Acceptance threshold: 5% max pixel drift (maxDiffPixelRatio: 0.05).
 * Reference baselines:
 *   - Empty state: design/drafts/theme-tron-v1.html
 *   - Populated state: design/drafts/landing-populated.html
 *
 * Note: Playwright browsers must be installed before running these tests.
 * If not installed, run: npx playwright install
 */
import { test, expect } from '@playwright/test';
import { uploadFixture, waitForProcessing, deleteAllSessions } from '../helpers/seed-visual-data';

// Override the global toHaveScreenshot threshold for gallery tests (5%)
const SCREENSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.05,
} as const;

test.describe('Gallery Page — Empty State', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await deleteAllSessions();
  });

  test('empty state desktop (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('.landing-empty', { timeout: 10000 });
    // Wait for all background layers to appear
    await page.waitForSelector('.background-grid', { timeout: 5000 }).catch(() => {
      // Background grid may not have a root class; continue
    });
    // Allow entrance animations to start before capturing
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('gallery-empty-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [],
    });
  });

  test('empty state mobile (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForSelector('.landing-empty', { timeout: 10000 });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('gallery-empty-mobile.png', {
      ...SCREENSHOT_OPTIONS,
    });
  });

  test('empty state — reduced motion (desktop)', async ({ page }) => {
    // Force prefers-reduced-motion: reduce media feature
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('.landing-empty', { timeout: 10000 });
    // With reduced motion all content renders immediately — no delay needed
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('gallery-empty-reduced-motion.png', {
      ...SCREENSHOT_OPTIONS,
    });
  });
});

test.describe('Gallery Page — Populated State', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await deleteAllSessions();
    // Seed 3 sessions in different ready states: valid-with-markers, valid-without-markers, valid-with-markers
    for (const fixture of [
      'valid-with-markers.cast',
      'valid-without-markers.cast',
      'valid-with-markers.cast',
    ] as const) {
      const id = await uploadFixture(fixture);
      await waitForProcessing(id);
    }
  });

  test.afterAll(async () => {
    await deleteAllSessions();
  });

  test('populated state desktop (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('.landing__session-grid', { timeout: 10000 });
    await page.waitForSelector('.landing__gallery-card', { timeout: 10000 });
    const cards = page.locator('.landing__gallery-card');
    await expect(cards).toHaveCount(3);

    await expect(page).toHaveScreenshot('gallery-populated-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      // Mask dynamic timestamps to prevent false failures from changing relative times
      mask: [page.locator('.landing__card-date')],
    });
  });

  test('populated state mobile (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForSelector('.landing__session-grid', { timeout: 10000 });
    await page.waitForSelector('.landing__gallery-card', { timeout: 10000 });

    await expect(page).toHaveScreenshot('gallery-populated-mobile.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [page.locator('.landing__card-date')],
    });
  });
});

test.describe('Gallery Page — Skeleton Loading State', () => {
  test('skeleton cards visible during initial load', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Intercept the sessions API to delay response, so we can capture the skeleton state
    await page.route('**/api/sessions', async (route) => {
      // Delay long enough to capture skeleton, then continue
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    // Navigate — do NOT await networkidle; capture skeleton immediately
    const navigation = page.goto('/');

    // Wait for skeleton cards to appear (before the delayed API response)
    await page.waitForSelector('.landing__skeleton-card', { timeout: 8000 });

    await expect(page).toHaveScreenshot('gallery-skeleton-loading.png', {
      ...SCREENSHOT_OPTIONS,
    });

    // Allow the navigation to complete before test cleanup
    await navigation;
  });
});
