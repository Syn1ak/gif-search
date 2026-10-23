import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lazy-loads the GIF search page at the root path', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Find the perfect GIF');
  });

  it('redirects unknown paths to the search page', async () => {
    const harness = await RouterTestingHarness.create('/does/not/exist');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('h1')).not.toBeNull();
  });
});
