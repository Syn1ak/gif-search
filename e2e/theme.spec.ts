import { Page } from '@playwright/test';
import { buildGifs, expect, test } from './support/giphy-mock';

const themeToggle = (page: Page) => page.getByRole('button', { name: /^Theme:/ });
const rootHasClass = (page: Page, name: string) =>
  page.evaluate((className) => document.documentElement.classList.contains(className), name);

test.describe('theme', () => {
  test.beforeEach(async ({ page, giphy }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await giphy.trending(buildGifs(3));
    await page.goto('/');
  });

  test('cycles system → light → dark and keeps the choice after a reload', async ({ page }) => {
    await expect(themeToggle(page)).toHaveAccessibleName('Theme: System. Switch to Light');

    await themeToggle(page).click();
    await expect(themeToggle(page)).toHaveAccessibleName('Theme: Light. Switch to Dark');

    await themeToggle(page).click();
    await expect(themeToggle(page)).toHaveAccessibleName('Theme: Dark. Switch to System');
    expect(await rootHasClass(page, 'dark')).toBe(true);
    const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.reload();

    await expect(themeToggle(page)).toHaveAccessibleName('Theme: Dark. Switch to System');
    expect(await rootHasClass(page, 'dark')).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(darkBackground);
  });

  test('applies the saved theme before the app starts', async ({ page }) => {
    await themeToggle(page).click();
    await themeToggle(page).click();

    // Hold the app bundle back: only the inline script in index.html can have run.
    let releaseApp = (): void => undefined;
    const appHeld = new Promise<void>((resolve) => (releaseApp = resolve));
    await page.route(/\/main(-[A-Z0-9]+)?\.js$/, async (route) => {
      await appHeld;
      await route.continue();
    });

    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => document.querySelector('app-root') !== null);

    expect(await page.evaluate(() => document.querySelector('app-root')!.childElementCount)).toBe(0);
    expect(await rootHasClass(page, 'dark')).toBe(true);

    releaseApp();
    await expect(themeToggle(page)).toBeVisible();
  });

  test('follows the OS in system mode', async ({ page }) => {
    expect(await rootHasClass(page, 'dark')).toBe(false);

    await page.emulateMedia({ colorScheme: 'dark' });

    await expect.poll(() => rootHasClass(page, 'dark')).toBe(true);
  });
});
