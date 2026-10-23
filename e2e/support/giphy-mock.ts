import { test as base, expect, Page, Route } from '@playwright/test';
import type { IGiphyGif } from '../../src/app/core/entities/giphy/gif.dto';
import type {
  IGiphyListResponse,
  IGiphySingleResponse,
} from '../../src/app/core/entities/giphy/giphy-response.dto';

const API_ORIGIN = 'https://api.giphy.com';
const API_PATH = '/v1/gifs';
const DEFAULT_PAGE_SIZE = 30;
const MEDIA_URL = /^https:\/\/media\d*\.giphy\.com\//;
/** 1×1 transparent GIF served for every Giphy media URL, so tests never download real media. */
const TINY_GIF = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

type TListEndpoint = 'trending' | 'search';

type TListOptions = {
  /** Value reported as `pagination.total_count`; defaults to the number of items. */
  total?: number;
  /** Keep responses pending until `release()` is called, to assert loading states. */
  held?: boolean;
};

export type TMockedEndpoint = {
  /** URLs of the requests the mock answered, in order. */
  readonly requests: URL[];
  release(): void;
};

/** Keeps the key out of assertion messages and HTML reports. */
function withoutApiKey(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (url.searchParams.has('api_key')) {
    url.searchParams.set('api_key', '***');
  }
  return url.toString();
}

export function buildGif(id: string, overrides: Partial<IGiphyGif> = {}): IGiphyGif {
  const media = `https://media.giphy.com/media/${id}`;
  // Alternate aspect ratios so the masonry layout has something to balance.
  const height = String([113, 150, 200, 267][id.length % 4]);

  return {
    type: 'gif',
    id,
    slug: `funny-${id}`,
    url: `https://giphy.com/gifs/funny-${id}`,
    embed_url: `https://giphy.com/embed/${id}`,
    username: 'e2e_author',
    title: `Funny GIF ${id}`,
    alt_text: `Animated GIF ${id}`,
    rating: 'g',
    source: '',
    source_tld: '',
    source_post_url: '',
    import_datetime: '2024-05-17 10:20:30',
    trending_datetime: '0000-00-00 00:00:00',
    user: {
      username: 'e2e_author',
      display_name: 'E2E Author',
      avatar_url: `${media}/avatar.gif`,
      profile_url: 'https://giphy.com/e2e_author/',
    },
    images: {
      original: {
        url: `${media}/giphy.gif`,
        width: '480',
        height: String(Number(height) * 2.4),
        size: '1048576',
      },
      original_still: {
        url: `${media}/giphy_s.gif`,
        width: '480',
        height: String(Number(height) * 2.4),
      },
      fixed_width: {
        url: `${media}/200w.gif`,
        webp: `${media}/200w.webp`,
        width: '200',
        height,
      },
      fixed_width_still: {
        url: `${media}/200w_s.gif`,
        width: '200',
        height,
      },
    },
    ...overrides,
  };
}

export function buildGifs(count: number, prefix = 'gif'): IGiphyGif[] {
  return Array.from({ length: count }, (_, index) => buildGif(`${prefix}-${index + 1}`));
}

/** Route-level Giphy mock. Any API call that no helper answered fails the test. */
export class GiphyMock {
  readonly unexpectedRequests: string[] = [];

  constructor(private readonly page: Page) {}

  /** Registers the fallbacks. Playwright tries the most recently registered route first. */
  async install(): Promise<void> {
    await this.page.route(
      (url) => url.origin === API_ORIGIN,
      (route) => {
        this.unexpectedRequests.push(withoutApiKey(route.request().url()));
        return route.fulfill({
          status: 501,
          json: {
            meta: {
              status: 501,
              msg: 'Not mocked',
              response_id: '',
            },
          },
        });
      },
    );
    // Context-wide, so tabs the app opens get it too; CORS like the real CDN, which downloads rely on.
    // A page route for a media URL (e.g. to fail one download) still takes precedence over it.
    await this.page.context().route(MEDIA_URL, (route) =>
      route.fulfill({
        contentType: 'image/gif',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: TINY_GIF,
      }),
    );
    await this.page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
      route.fulfill({
        contentType: 'text/css',
        body: '',
      }),
    );
  }

  trending(items: IGiphyGif[], options: TListOptions = {}): Promise<TMockedEndpoint> {
    return this.list('trending', () => true, items, options);
  }

  search(query: string, items: IGiphyGif[], options: TListOptions = {}): Promise<TMockedEndpoint> {
    return this.list('search', (url) => url.searchParams.get('q') === query, items, options);
  }

  async gifById(gif: IGiphyGif): Promise<TMockedEndpoint> {
    return this.answer(
      `${API_PATH}/${gif.id}`,
      () => true,
      (route) => route.fulfill({ json: this.single(gif) }),
    );
  }

  /** Answers `GET /gifs/{id}` with an HTTP error, e.g. 404 for an unknown id. */
  async gifByIdError(id: string, status: number): Promise<TMockedEndpoint> {
    return this.answer(
      `${API_PATH}/${id}`,
      () => true,
      (route) =>
        route.fulfill({
          status,
          json: {
            meta: {
              status,
              msg: 'Error',
              response_id: '',
            },
          },
        }),
    );
  }

  /** Answers an endpoint with an HTTP error, e.g. 401 (bad key) or 429 (rate limit). */
  async error(endpoint: TListEndpoint, status: number): Promise<TMockedEndpoint> {
    return this.answer(
      `${API_PATH}/${endpoint}`,
      () => true,
      (route) =>
        route.fulfill({
          status,
          json: {
            meta: {
              status,
              msg: 'Error',
              response_id: '',
            },
          },
        }),
    );
  }

  /** Makes one media file unreachable for this page, e.g. to fail a download. */
  async mediaUnavailable(url: string): Promise<void> {
    await this.page.route(url, (route) => route.abort('connectionfailed'));
  }

  /** Simulates a dropped connection for an endpoint. */
  async offline(endpoint: TListEndpoint): Promise<TMockedEndpoint> {
    return this.answer(
      `${API_PATH}/${endpoint}`,
      () => true,
      (route) => route.abort('internetdisconnected'),
    );
  }

  private list(
    endpoint: TListEndpoint,
    matches: (url: URL) => boolean,
    items: IGiphyGif[],
    { total = items.length, held = false }: TListOptions,
  ): Promise<TMockedEndpoint> {
    return this.answer(
      `${API_PATH}/${endpoint}`,
      matches,
      (route, url) => {
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const limit = Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE);
        const data = items.slice(offset, offset + limit);
        const body: IGiphyListResponse<IGiphyGif> = {
          data,
          pagination: {
            offset,
            count: data.length,
            total_count: total,
          },
          meta: {
            status: 200,
            msg: 'OK',
            response_id: `e2e-${endpoint}-${offset}`,
          },
        };
        return route.fulfill({ json: body });
      },
      held,
    );
  }

  private single(gif: IGiphyGif): IGiphySingleResponse<IGiphyGif> {
    return {
      data: gif,
      meta: {
        status: 200,
        msg: 'OK',
        response_id: `e2e-gif-${gif.id}`,
      },
    };
  }

  private async answer(
    pathname: string,
    matches: (url: URL) => boolean,
    respond: (route: Route, url: URL) => Promise<void>,
    held = false,
  ): Promise<TMockedEndpoint> {
    const requests: URL[] = [];
    let release = (): void => undefined;
    const gate = held ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve();

    await this.page.route(
      (url) => url.origin === API_ORIGIN && url.pathname === pathname && matches(url),
      async (route) => {
        const url = new URL(route.request().url());
        requests.push(url);
        await gate;
        await respond(route, url);
      },
    );

    return {
      requests,
      release: () => release(),
    };
  }
}

export const test = base.extend<{ giphy: GiphyMock }>({
  giphy: [
    async ({ page }, use) => {
      const giphy = new GiphyMock(page);
      await giphy.install();
      await use(giphy);
      expect(giphy.unexpectedRequests, 'Giphy API requests without a mock').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
