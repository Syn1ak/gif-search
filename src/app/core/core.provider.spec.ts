import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GIPHY_CONFIG } from './tokens/giphy-config.token';
import { provideCore } from './core.provider';

describe('provideCore', () => {
  it('provides an HttpClient that authenticates Giphy API calls', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCore({ routes: [] }),
        provideHttpClientTesting(),
        { provide: GIPHY_CONFIG, useValue: { apiKey: 'secret', baseUrl: 'https://api.giphy.test/v1' } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(HttpClient).get('https://api.giphy.test/v1/gifs/trending').subscribe();

    const req = http.expectOne((r) => r.url === 'https://api.giphy.test/v1/gifs/trending');
    expect(req.request.params.get('api_key')).toBe('secret');
    req.flush({});
    http.verify();
  });
});
