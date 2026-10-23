import { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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

test.describe('download', () => {
  const ORIGINAL_URL = 'https://media.giphy.com/media/gif-1/giphy.gif';

  test('saves the original GIF as <slug>-<id>.gif', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(3));
    await page.goto('/');
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-1' }).click();

    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: 'Download' }).click();
    const download = await downloadEvent;

    expect(download.suggestedFilename()).toBe('funny-gif-1.gif');
    const file = await readFile(await download.path());
    expect(file.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  });

  test('offers to open the GIF in a new tab when the download fails', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(3));
    await giphy.mediaUnavailable(ORIGINAL_URL);
    await page.goto('/');
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-1' }).click();

    await page.getByRole('dialog').getByRole('button', { name: 'Download' }).click();

    await expect(page.getByText('Couldn’t download the GIF.')).toBeVisible();
    const popupEvent = page.context().waitForEvent('page');
    await page.getByRole('button', { name: 'Open in new tab' }).click();
    const popup = await popupEvent;

    await expect(popup).toHaveURL(ORIGINAL_URL);
  });
});
