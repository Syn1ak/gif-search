import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { IGiphyGif } from '../../../../../../core/entities/giphy/gif.dto';
import { IGiphyListResponse } from '../../../../../../core/entities/giphy/giphy-response.dto';
import { GiphyApiError } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import {
  buildGifDto as gifDto,
  buildListResponse as listResponse,
} from '../../../../../../../testing/giphy-builders';
import { GifSearchFacade } from './gif-search.facade';

describe('GifSearchFacade', () => {
  let trending$: Subject<IGiphyListResponse<IGiphyGif>>;
  let client: { trending$: ReturnType<typeof vi.fn>; search$: ReturnType<typeof vi.fn> };
  let facade: GifSearchFacade;

  beforeEach(() => {
    trending$ = new Subject();
    client = {
      trending$: vi.fn(() => trending$),
      search$: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        GifSearchFacade,
        {
          provide: GifsClient,
          useValue: client,
        },
      ],
    });
    facade = TestBed.inject(GifSearchFacade);
  });

  it('loads the first trending page for an empty query', () => {
    facade.search('  ');

    expect(client.trending$).toHaveBeenCalledWith({ offset: 0 });
    expect(client.search$).not.toHaveBeenCalled();
    expect(facade.$mode()).toBe('trending');
    expect(facade.$status()).toBe('loading');

    trending$.next(listResponse([gifDto('a'), gifDto('b')]));

    expect(facade.$status()).toBe('loaded');
    expect(facade.$items().map((gif) => gif.id)).toEqual(['a', 'b']);
  });

  it('drops GIFs without a usable original rendition', () => {
    facade.search('');
    trending$.next(listResponse([gifDto('a'), gifDto('broken', false), gifDto('c')]));

    expect(facade.$items().map((gif) => gif.id)).toEqual(['a', 'c']);
  });

  it('exposes the error kind when the request fails', () => {
    client.trending$.mockReturnValue(throwError(() => new GiphyApiError('rate-limited', 429, 'Too many')));

    facade.search('');

    expect(facade.$status()).toBe('error');
    expect(facade.$error()).toBe('rate-limited');
    expect(facade.$items()).toEqual([]);
  });

  it('reports unexpected failures as "unknown"', () => {
    client.trending$.mockReturnValue(throwError(() => new Error('boom')));

    facade.search('');

    expect(facade.$error()).toBe('unknown');
  });

  describe('keyword search', () => {
    it('searches the trimmed query from the first page', () => {
      const search$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.search$.mockReturnValue(search$);

      facade.search('  happy cats ');

      expect(client.search$).toHaveBeenCalledWith({
        q: 'happy cats',
        offset: 0,
      });
      expect(facade.$mode()).toBe('search');
      expect(facade.$query()).toBe('happy cats');

      search$.next(listResponse([gifDto('cat')]));

      expect(facade.$items().map((gif) => gif.id)).toEqual(['cat']);
    });

    it('ignores the response of a query that was replaced by a newer one', () => {
      const slow$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      const fast$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.search$.mockReturnValueOnce(slow$).mockReturnValueOnce(fast$);

      facade.search('cats');
      facade.search('dogs');
      fast$.next(listResponse([gifDto('dog')]));
      slow$.next(listResponse([gifDto('cat')]));

      expect(facade.$query()).toBe('dogs');
      expect(facade.$items().map((gif) => gif.id)).toEqual(['dog']);
    });

    it('reports an empty result as loaded with no items', () => {
      const search$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.search$.mockReturnValue(search$);

      facade.search('qwertyuiop');
      search$.next(listResponse([], 0));

      expect(facade.$status()).toBe('loaded');
      expect(facade.$items()).toEqual([]);
    });
  });

  describe('loading more', () => {
    const ids = () => facade.$items().map((gif) => gif.id);
    const page = (prefix: string, count = 2) =>
      Array.from({ length: count }, (_, i) => gifDto(`${prefix}${i}`));

    function loadFirstTrendingPage(total = 100): void {
      facade.search('');
      trending$.next(listResponse(page('a'), total));
    }

    it('appends the next page and drops GIFs that were already shown', () => {
      loadFirstTrendingPage();
      const next$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.trending$.mockReturnValue(next$);

      facade.loadMore();

      expect(client.trending$).toHaveBeenLastCalledWith({ offset: 2 });
      expect(facade.$status()).toBe('loading-more');
      expect(ids()).toEqual(['a0', 'a1']);

      next$.next(listResponse([gifDto('a1'), gifDto('b0')], 100, 2));

      expect(facade.$status()).toBe('loaded');
      expect(ids()).toEqual(['a0', 'a1', 'b0']);
    });

    it('does not request the same page twice while it is loading', () => {
      loadFirstTrendingPage();
      client.trending$.mockReturnValue(new Subject());

      facade.loadMore();
      facade.loadMore();

      expect(client.trending$).toHaveBeenCalledTimes(2);
    });

    it('does nothing before the first page has loaded', () => {
      facade.search('');
      facade.loadMore();

      expect(client.trending$).toHaveBeenCalledTimes(1);
    });

    it('stops at the total reported by Giphy', () => {
      loadFirstTrendingPage(2);

      expect(facade.$hasMore()).toBe(false);
      facade.loadMore();

      expect(client.trending$).toHaveBeenCalledTimes(1);
    });

    it('stops at the highest offset the endpoint accepts', () => {
      facade.search('');
      trending$.next(listResponse(page('a', 30), 10000, 480));

      expect(facade.$hasMore()).toBe(false);
    });

    it('stops when Giphy returns an empty page', () => {
      loadFirstTrendingPage();
      const next$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.trending$.mockReturnValue(next$);

      facade.loadMore();
      next$.next(listResponse([], 100, 2));

      expect(facade.$hasMore()).toBe(false);
      expect(ids()).toEqual(['a0', 'a1']);
    });

    it('drops a pending page when a new search starts', () => {
      loadFirstTrendingPage();
      const next$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      const cats$ = new Subject<IGiphyListResponse<IGiphyGif>>();
      client.trending$.mockReturnValue(next$);
      client.search$.mockReturnValue(cats$);

      facade.loadMore();
      facade.search('cats');
      next$.next(listResponse(page('b'), 100, 2));
      cats$.next(listResponse(page('c')));

      expect(ids()).toEqual(['c0', 'c1']);
    });
  });
});
