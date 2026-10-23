import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { IGiphyGif } from '../../../../../../core/entities/giphy/gif.dto';
import { IGiphyListResponse } from '../../../../../../core/entities/giphy/giphy-response.dto';
import { GiphyApiError } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import { GifSearchFacade } from './gif-search.facade';

function gifDto(id: string, original = true): IGiphyGif {
  return {
    id,
    slug: `slug-${id}`,
    title: `GIF ${id}`,
    url: `https://giphy.com/gifs/${id}`,
    images: original
      ? {
          original: {
            url: `https://media.test/${id}.gif`,
            width: '480',
            height: '270',
          },
          fixed_width: {
            url: `https://media.test/${id}-200.gif`,
            width: '200',
            height: '113',
          },
        }
      : {},
  } as IGiphyGif;
}

function listResponse(data: IGiphyGif[], total = 100): IGiphyListResponse<IGiphyGif> {
  return {
    data,
    pagination: {
      offset: 0,
      count: data.length,
      total_count: total,
    },
    meta: {
      status: 200,
      msg: 'OK',
      response_id: 'r',
    },
  };
}

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
});
