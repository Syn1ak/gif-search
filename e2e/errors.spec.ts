import type { Page } from '@playwright/test';
import { buildGifs, expect, test } from './support/giphy-mock';

const cards = (page: Page) => page.getByRole('button', { name: /^Open details for/ });

test.describe('error states', () => {
  test('explains an invalid API key without offering a retry', async ({ page, giphy }) => {
    await giphy.error('trending', 401);

    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText('API key is missing or invalid');
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });

  test('recovers from the rate limit with Try again', async ({ page, giphy }) => {
    await giphy.error('trending', 429);
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Rate limit reached');

    // Registered later, so it answers the retry.
    await giphy.trending(buildGifs(5));
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(cards(page)).toHaveCount(5);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('recovers from a dropped connection', async ({ page, giphy }) => {
    await giphy.offline('trending');
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('You seem to be offline');

    await giphy.trending(buildGifs(5));
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(cards(page)).toHaveCount(5);
  });

  test('keeps the loaded GIFs when the next page fails and retries it inline', async ({ page, giphy }) => {
    const gifs = buildGifs(60);
    await giphy.trending(gifs);
    await page.goto('/');
    await expect(cards(page)).toHaveCount(30);

    await giphy.error('trending', 500);
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Couldn’t load more GIFs');
    await expect(cards(page)).toHaveCount(30);

    await giphy.trending(gifs);
    await alert.getByRole('button', { name: 'Try again' }).click();

    await expect(cards(page)).toHaveCount(60);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
