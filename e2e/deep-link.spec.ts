import { buildGif, buildGifs, expect, test } from './support/giphy-mock';

const cards = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /^Open details for/ });

test.describe('GIF deep link', () => {
  test('opens the search with the GIF’s details on top, loading the GIF by id', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(6, 'cat'));
    const byId = await giphy.gifById(buildGif('shared-1'));

    await page.goto('/?q=cats&gif=shared-1');

    const dialog = page.getByRole('dialog', { name: 'Funny GIF shared-1' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Animated GIF shared-1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Results for “cats”' })).toBeAttached();
    await expect(cards(page)).toHaveCount(6);
    expect(byId.requests).toHaveLength(1);
  });

  test('puts the open GIF in the URL, and Back closes it', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(6, 'cat'));
    await page.goto('/?q=cats');

    await page.getByRole('button', { name: 'Open details for Funny GIF cat-2' }).click();

    const dialog = page.getByRole('dialog', { name: 'Funny GIF cat-2' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\?q=cats&gif=cat-2$/);

    await page.goBack();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\?q=cats$/);
  });

  test('removes the GIF from the URL when the dialog is closed', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(6, 'cat'));
    await giphy.gifById(buildGif('shared-1'));

    await page.goto('/?q=cats&gif=shared-1');
    await page.getByRole('button', { name: 'Close details' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\?q=cats$/);
  });

  test('says when the GIF does not exist', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(3));
    await giphy.gifByIdError('nope', 404);

    await page.goto('/?gif=nope');

    const dialog = page.getByRole('dialog', { name: 'GIF not found' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('removed from GIPHY');
    await expect(dialog.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });
});
