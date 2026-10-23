import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GiphyApiError, TGiphyErrorKind } from '../models/giphy-error';
import { GIPHY_CONFIG } from '../tokens/giphy-config.token';
import { giphyErrorInterceptor } from './giphy-error.interceptor';

const API_URL = 'https://api.giphy.test/v1/gifs/search';

describe('giphyErrorInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([giphyErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: GIPHY_CONFIG, useValue: { baseUrl: 'https://api.giphy.test/v1' } },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function request(url = API_URL): { error: () => unknown; body: () => unknown } {
    let error: unknown;
    let body: unknown;
    httpClient.get(url).subscribe({ next: (value) => (body = value), error: (value) => (error = value) });
    return { error: () => error, body: () => body };
  }

  it.each<[number, TGiphyErrorKind]>([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [429, 'rate-limited'],
    [500, 'unknown'],
    [404, 'unknown'],
  ])('maps HTTP %i to "%s"', (status, kind) => {
    const result = request();

    http.expectOne(API_URL).flush({ meta: { status, msg: 'Nope' } }, { status, statusText: 'Nope' });

    expect(result.error()).toBeInstanceOf(GiphyApiError);
    expect(result.error()).toMatchObject({ kind, status });
  });

  it('maps a failed connection to "network"', () => {
    const result = request();

    http.expectOne(API_URL).error(new ProgressEvent('error'));

    expect(result.error()).toMatchObject({ kind: 'network', status: 0 });
  });

  it('treats a 200 "synthetic" response with an empty response_id as an error', () => {
    const result = request();

    http.expectOne(API_URL).flush({ data: [], meta: { status: 200, msg: 'OK', response_id: '' } });

    expect(result.body()).toBeUndefined();
    expect(result.error()).toMatchObject({ kind: 'unknown', status: 200 });
  });

  it('passes a regular successful response through', () => {
    const result = request();
    const body = { data: [], meta: { status: 200, msg: 'OK', response_id: 'abc' } };

    http.expectOne(API_URL).flush(body);

    expect(result.error()).toBeUndefined();
    expect(result.body()).toEqual(body);
  });

  it('does not touch errors from other hosts', () => {
    const url = 'https://media.giphy.test/media/abc/giphy.gif';
    const result = request(url);

    http.expectOne(url).flush(null, { status: 404, statusText: 'Not Found' });

    expect(result.error()).toBeInstanceOf(HttpErrorResponse);
  });
});
