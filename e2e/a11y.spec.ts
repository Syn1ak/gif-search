import { buildGifs, expect, test } from './support/giphy-mock';

const ANIMATED_PREVIEW = 'https://media.giphy.com/media/gif-1/200w.webp';
const STILL_PREVIEW = 'https://media.giphy.com/media/gif-1/200w_s.gif';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows still frames, and animates a GIF only while it is hovered or focused', async ({
    page,
    giphy,
  }) => {
    await giphy.trending(buildGifs(3));
    await page.goto('/');

    const card = page.getByRole('button', { name: 'Open details for Funny GIF gif-1' });
    const preview = card.getByRole('img', { name: 'Animated GIF gif-1' });
    const animatedOverlay = card.locator('img[aria-hidden="true"]');

    await expect
      .poll(() => preview.evaluate((image: HTMLImageElement) => image.currentSrc))
      .toBe(STILL_PREVIEW);
    await expect(animatedOverlay).toHaveCount(0);

    await card.hover();
    await expect(animatedOverlay).toHaveAttribute('src', ANIMATED_PREVIEW);

    await page.mouse.move(0, 0);
    await expect(animatedOverlay).toHaveCount(0);

    await card.focus();
    await expect(animatedOverlay).toBeVisible();
  });
});

test.describe('motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('shows the animated previews', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(3));
    await page.goto('/');

    const preview = page.getByRole('img', { name: 'Animated GIF gif-1' });
    await expect
      .poll(() => preview.evaluate((image: HTMLImageElement) => image.currentSrc))
      .toBe(ANIMATED_PREVIEW);
  });
});

test.describe('keyboard and layout', () => {
  test('a skip link moves focus past the header without leaving the page', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(3, 'cat'));
    await page.goto('/?q=cats');
    await expect(page.getByRole('heading', { name: 'Results for “cats”' })).toBeVisible();

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('main')).toBeFocused();
    await expect(page).toHaveURL(/\?q=cats$/);
  });

  test('stacks the dialog actions full-width on phones, Download first', async ({
    page,
    giphy,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'The stacked layout applies below the sm breakpoint');

    await giphy.trending(buildGifs(3));
    await page.goto('/');
    await page.getByRole('button', { name: 'Open details for Funny GIF gif-1' }).click();

    const dialog = page.getByRole('dialog');
    // The dialog opens with a short scale-up animation; measure once it has settled.
    const surface = dialog.locator('.mat-mdc-dialog-surface');
    await expect.poll(() => surface.evaluate((element) => getComputedStyle(element).transform)).toBe('none');

    const download = await dialog.getByRole('button', { name: 'Download' }).boundingBox();
    const copyLink = await dialog
      .getByRole('button', {
        name: 'Copy link',
        exact: true,
      })
      .boundingBox();
    const openOnGiphy = await dialog.getByRole('link', { name: 'Open on GIPHY' }).boundingBox();

    expect(download!.y).toBeLessThan(copyLink!.y);
    expect(copyLink!.y).toBeLessThan(openOnGiphy!.y);
    expect(download!.width).toBeCloseTo(copyLink!.width, 0);
    expect(download!.width).toBeCloseTo(openOnGiphy!.width, 0);
    expect(download!.width).toBeGreaterThan(page.viewportSize()!.width * 0.8);
  });
});
