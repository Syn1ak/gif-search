import { buildGif, buildGifs, expect, test } from './support/giphy-mock';

test.describe('GIF details', () => {
  test('opens from a card with the GIF and its details, and closes back to the card', async ({
    page,
    giphy,
  }) => {
    await giphy.trending(buildGifs(6));
    await page.goto('/');

    const card = page.getByRole('button', { name: 'Open details for Funny GIF gif-1' });
    await card.click();

    const dialog = page.getByRole('dialog', { name: 'Funny GIF gif-1' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Animated GIF gif-1' })).toHaveAttribute(
      'src',
      'https://media.giphy.com/media/gif-1/giphy.gif',
    );
    await expect(dialog.getByRole('link', { name: 'E2E Author' })).toHaveAttribute(
      'href',
      'https://giphy.com/e2e_author/',
    );
    await expect(dialog).toContainText('May 17, 2024');
    await expect(dialog).toContainText('480 × 360 px');
    await expect(dialog).toContainText('1 MB');
    await expect(dialog.getByRole('link', { name: 'Open on GIPHY' })).toHaveAttribute(
      'href',
      'https://giphy.com/gifs/funny-gif-1',
    );

    await dialog.getByRole('button', { name: 'Close details' }).click();

    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
  });

  test('opens with Enter and closes with Escape, returning focus to the card', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(6));
    await page.goto('/');

    const card = page.getByRole('button', { name: 'Open details for Funny GIF gif-2' });
    await card.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Funny GIF gif-2' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
  });

  test('says when the author and the creation date are unknown', async ({ page, giphy }) => {
    await giphy.trending([
      buildGif('anon', {
        user: undefined,
        username: '',
        import_datetime: '0000-00-00 00:00:00',
      }),
    ]);
    await page.goto('/');

    await page.getByRole('button', { name: 'Open details for Funny GIF anon' }).click();

    const dialog = page.getByRole('dialog', { name: 'Funny GIF anon' });
    await expect(dialog).toContainText('Unknown author');
    await expect(dialog.locator('dt', { hasText: 'Created' }).locator('+ dd')).toHaveText('Unknown');
  });

  test('fills the screen on phones', async ({ page, giphy }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Full-screen layout applies below the sm breakpoint');

    await giphy.trending(buildGifs(3));
    await page.goto('/');
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-1' }).click();

    const box = await page.getByRole('dialog').boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).toEqual({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  });
});
