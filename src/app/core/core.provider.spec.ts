import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { GiphyApiError } from './models/giphy-error';
import { GIPHY_CONFIG } from './tokens/giphy-config.token';
import { provideCore } from './core.provider';

const TRENDING_URL = 'https://api.giphy.test/v1/gifs/trending';

describe('provideCore', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCore({ routes: [] }),
        provideHttpClientTesting(),
        {
          provide: GIPHY_CONFIG,
          useValue: {
            apiKey: 'secret',
            baseUrl: 'https://api.giphy.test/v1',
          },
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('provides an HttpClient that authenticates Giphy API calls', () => {
    httpClient.get(TRENDING_URL).subscribe();

    const req = http.expectOne((r) => r.url === TRENDING_URL);
    expect(req.request.params.get('api_key')).toBe('secret');
    req.flush({});
  });

  it('provides an HttpClient that reports Giphy failures as GiphyApiError', () => {
    let error: unknown;
    httpClient.get(TRENDING_URL).subscribe({ error: (value) => (error = value) });

    http
      .expectOne((r) => r.url === TRENDING_URL)
      .flush(null, {
        status: 429,
        statusText: 'Too Many Requests',
      });

    expect(error).toBeInstanceOf(GiphyApiError);
    expect(error).toMatchObject({ kind: 'rate-limited' });
  });

  it('renders <mat-icon> ligatures with the Material Symbols Rounded font', () => {
    expect(TestBed.inject(MatIconRegistry).getDefaultFontSetClass()).toEqual(['material-symbols-rounded']);
  });
});
