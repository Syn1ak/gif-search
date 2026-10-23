import { buildGifs, expect, test } from './support/giphy-mock';

test.describe('first visit', () => {
  test('shows a skeleton, then the first page of trending GIFs', async ({ page, giphy }) => {
    const trending = await giphy.trending(buildGifs(30), { held: true });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Trending now' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Loading GIFs');

    trending.release();

    await expect(page.getByRole('button', { name: /^Open details for/ })).toHaveCount(30);
    await expect(page.getByRole('status')).toHaveCount(0);

    expect(trending.requests).toHaveLength(1);
    const params = trending.requests[0]!.searchParams;
    expect(params.get('offset')).toBe('0');
    expect(params.get('limit')).toBe('30');
    expect(params.get('rating')).toBe('g');
    expect(params.has('api_key')).toBe(true);
  });

  test('lays the grid out in columns that fit the viewport', async ({ page, giphy }, testInfo) => {
    await giphy.trending(buildGifs(12));

    await page.goto('/');

    const expectedColumns = testInfo.project.name === 'mobile' ? 2 : 5;
    await expect(page.locator('app-gif-grid > div > div')).toHaveCount(expectedColumns);
    await expect(
      page.getByRole('img', {
        name: 'Animated GIF gif-1',
        exact: true,
      }),
    ).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('credits GIPHY in the footer', async ({ page, giphy }) => {
    await giphy.trending(buildGifs(3));

    await page.goto('/');

    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Powered by GIPHY' }),
    ).toHaveAttribute('href', 'https://giphy.com');
  });
});
