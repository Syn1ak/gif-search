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
});
