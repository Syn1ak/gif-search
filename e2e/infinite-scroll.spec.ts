import type { Locator } from '@playwright/test';
import { buildGifs, expect, test } from './support/giphy-mock';

/** Position in the document, so scrolling does not change it. */
const documentPosition = (locator: Locator) =>
  locator.evaluate((element) => {
    const { left, top } = element.getBoundingClientRect();
    return {
      left: left + window.scrollX,
      top: top + window.scrollY,
    };
  });

test.describe('infinite scroll', () => {
  test('loads the next page near the bottom without moving the cards already shown', async ({
    page,
    giphy,
  }) => {
    const trending = await giphy.trending(buildGifs(60));
    const cards = page.getByRole('button', { name: /^Open details for/ });

    await page.goto('/');
    await expect(cards).toHaveCount(30);
    const firstCard = await documentPosition(cards.first());

    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();

    await expect(cards).toHaveCount(60);
    expect(trending.requests.map((url) => url.searchParams.get('offset'))).toEqual(['0', '30']);
    expect(await documentPosition(cards.first())).toEqual(firstCard);
  });

  test('shows the end of the results and stops requesting', async ({ page, giphy }) => {
    const trending = await giphy.trending(buildGifs(45));

    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Open details for/ })).toHaveCount(30);
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();

    await expect(page.getByText('End of results')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Open details for/ })).toHaveCount(45);

    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(300);
    expect(trending.requests).toHaveLength(2);
  });

  test('shows a loading indicator while the next page is on its way', async ({ page, giphy }) => {
    const gifs = buildGifs(60, 'cat');
    await giphy.search('cats', gifs);
    const cards = page.getByRole('button', { name: /^Open details for/ });

    await page.goto('/?q=cats');
    await expect(cards).toHaveCount(30);

    // Registered later, so it takes over the next request and keeps it pending.
    const nextPage = await giphy.search('cats', gifs, { held: true });
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();

    await expect(page.getByRole('status')).toContainText('Loading more GIFs');
    nextPage.release();
    await expect(cards).toHaveCount(60);
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
