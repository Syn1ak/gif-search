import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GIPHY_CONFIG } from '../tokens/giphy-config.token';
import { giphyApiKeyInterceptor } from './giphy-api-key.interceptor';

describe('giphyApiKeyInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([giphyApiKeyInterceptor])),
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

  it('appends the api key to Giphy API requests and keeps existing params', () => {
    httpClient.get('https://api.giphy.test/v1/gifs/search', { params: { q: 'cats' } }).subscribe();

    const req = http.expectOne((r) => r.url === 'https://api.giphy.test/v1/gifs/search');
    expect(req.request.params.get('api_key')).toBe('secret');
    expect(req.request.params.get('q')).toBe('cats');
    req.flush({});
  });

  it('leaves requests to other hosts untouched', () => {
    httpClient.get('https://media.giphy.test/media/abc/giphy.gif').subscribe();

    const req = http.expectOne('https://media.giphy.test/media/abc/giphy.gif');
    expect(req.request.params.has('api_key')).toBe(false);
    req.flush({});
  });
});
