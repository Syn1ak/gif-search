import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TGiphyConfig } from '../../../models/giphy-config.types';
import { GIPHY_CONFIG } from '../../../tokens/giphy-config.token';
import { GifsClient } from './gifs.client';

const CONFIG: TGiphyConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://api.giphy.test/v1',
  pageSize: 30,
  rating: 'g',
  lang: 'en',
  offsetCap: {
    search: 4999,
    trending: 499,
  },
};

describe('GifsClient', () => {
  let client: GifsClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: GIPHY_CONFIG,
          useValue: CONFIG,
        },
      ],
    });
    client = TestBed.inject(GifsClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches with the query, page and configured limits', () => {
    client
      .search$({
        q: 'happy cats',
        offset: 60,
      })
      .subscribe();

    const req = http.expectOne((r) => r.url === 'https://api.giphy.test/v1/gifs/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('happy cats');
    expect(req.request.params.get('offset')).toBe('60');
    expect(req.request.params.get('limit')).toBe('30');
    expect(req.request.params.get('rating')).toBe('g');
    expect(req.request.params.get('lang')).toBe('en');
    req.flush({
      data: [],
      pagination: {
        offset: 60,
        count: 0,
      },
      meta: {
        status: 200,
        msg: 'OK',
        response_id: 'x',
      },
    });
  });

  it('loads trending with page and rating but no query or language', () => {
    client.trending$({ offset: 0 }).subscribe();

    const req = http.expectOne((r) => r.url === 'https://api.giphy.test/v1/gifs/trending');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'offset', 'rating']);
    req.flush({
      data: [],
      pagination: {
        offset: 0,
        count: 0,
      },
      meta: {
        status: 200,
        msg: 'OK',
        response_id: 'x',
      },
    });
  });

  it('gets a single GIF by an url-encoded id', () => {
    let title: string | undefined;
    client.getById$('abc/123').subscribe((response) => (title = response.data.title));

    const req = http.expectOne('https://api.giphy.test/v1/gifs/abc%2F123');
    req.flush({
      data: { title: 'Hello' },
      meta: {
        status: 200,
        msg: 'OK',
        response_id: 'x',
      },
    });
    expect(title).toBe('Hello');
  });
});
