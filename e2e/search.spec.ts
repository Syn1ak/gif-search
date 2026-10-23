import type { Page } from '@playwright/test';
import { buildGifs, expect, test } from './support/giphy-mock';

const resultsHeading = (page: Page) => page.getByRole('heading', { level: 2 });
const searchBox = (page: Page) => page.getByRole('searchbox');
const cards = (page: Page) => page.getByRole('button', { name: /^Open details for/ });

test.describe('keyword search', () => {
  test.beforeEach(async ({ giphy }) => {
    await giphy.trending(buildGifs(6, 'trend'));
  });

  test('searches as the user types and puts the query in the URL', async ({ page, giphy }) => {
    const cats = await giphy.search('cats', buildGifs(4, 'cat'));
    await page.goto('/');

    await searchBox(page).fill('cats');

    await expect(resultsHeading(page)).toHaveText('Results for “cats”');
    await expect(cards(page)).toHaveCount(4);
    await expect(page).toHaveURL(/\?q=cats$/);
    expect(cats.requests).toHaveLength(1);
  });

  test('searches on Enter without a second request when the debounce fires', async ({ page, giphy }) => {
    // Immediacy is covered by the search-form unit test with fake timers.
    const dogs = await giphy.search('dogs', buildGifs(2, 'dog'));
    await page.goto('/');

    await searchBox(page).fill('dogs');
    await searchBox(page).press('Enter');

    await expect(resultsHeading(page)).toHaveText('Results for “dogs”');
    await page.waitForTimeout(700);
    expect(dogs.requests).toHaveLength(1);
  });

  test('returns to trending when the field is cleared', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(4, 'cat'));
    await page.goto('/?q=cats');
    await expect(cards(page)).toHaveCount(4);

    await page.getByRole('button', { name: 'Clear' }).click();

    await expect(resultsHeading(page)).toHaveText('Trending now');
    await expect(cards(page)).toHaveCount(6);
    await expect(page).toHaveURL(/\/$/);
  });

  test('explains when nothing matches', async ({ page, giphy }) => {
    await giphy.search('qwertyuiop', []);
    await page.goto('/');

    await searchBox(page).fill('qwertyuiop');

    await expect(page.getByText('Nothing found for “qwertyuiop”')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
  });

  test('rejects queries longer than 50 characters without calling the API', async ({ page }) => {
    await page.goto('/');

    await searchBox(page).fill('a'.repeat(51));
    await searchBox(page).press('Enter');

    await expect(page.getByText('Maximum length is 50 characters')).toBeVisible();
    await expect(resultsHeading(page)).toHaveText('Trending now');
    // The giphy fixture fails the test if any search request was sent without a mock.
  });

  test('restores a search from the URL and supports back and forward', async ({ page, giphy }) => {
    await giphy.search('cats', buildGifs(4, 'cat'));
    await giphy.search('dogs', buildGifs(2, 'dog'));

    await page.goto('/?q=cats');
    await expect(resultsHeading(page)).toHaveText('Results for “cats”');
    await expect(searchBox(page)).toHaveValue('cats');

    await searchBox(page).fill('dogs');
    await expect(resultsHeading(page)).toHaveText('Results for “dogs”');

    await page.goBack();
    await expect(resultsHeading(page)).toHaveText('Results for “cats”');
    await expect(searchBox(page)).toHaveValue('cats');

    await page.goForward();
    await expect(resultsHeading(page)).toHaveText('Results for “dogs”');
    await expect(cards(page)).toHaveCount(2);
  });
});
