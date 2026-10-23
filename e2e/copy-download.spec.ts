import { Page } from '@playwright/test';
import { buildGifs, expect, test } from './support/giphy-mock';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const readClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test.describe('copy links', () => {
  test.beforeEach(async ({ page, giphy }) => {
    await giphy.trending(buildGifs(6));
    await page.goto('/');
  });

  test('copies the media link and the GIPHY page link from the details', async ({ page }) => {
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-1' }).click();
    const dialog = page.getByRole('dialog', { name: 'Funny GIF gif-1' });

    await dialog
      .getByRole('button', {
        name: 'Copy link',
        exact: true,
      })
      .click();

    await expect(page.getByText('Link copied')).toBeVisible();
    expect(await readClipboard(page)).toBe('https://media.giphy.com/media/gif-1/giphy.gif');

    await dialog.getByRole('button', { name: 'Copy GIPHY page link' }).click();

    await expect.poll(() => readClipboard(page)).toBe('https://giphy.com/gifs/funny-gif-1');
  });

  test('copies the media link from a card without opening the details', async ({ page }) => {
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-2' }).hover();
    await page.getByRole('button', { name: 'Copy link to Funny GIF gif-2' }).click();

    await expect(page.getByText('Link copied')).toBeVisible();
    expect(await readClipboard(page)).toBe('https://media.giphy.com/media/gif-2/giphy.gif');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
