import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { buildGifDto, buildListResponse } from '../../../../../../testing/giphy-builders';
import { GifsClient } from '../../../../../core/services/api/giphy/gifs.client';
import { ROUTES } from '../gif-search.routes';

describe('GifSearchComponent', () => {
  let client: { trending$: ReturnType<typeof vi.fn>; search$: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    client = {
      trending$: vi.fn(() => of(buildListResponse([buildGifDto('trend')]))),
      search$: vi.fn(() => of(buildListResponse([buildGifDto('found')]))),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ROUTES, withComponentInputBinding()),
        {
          provide: GifsClient,
          useValue: client,
        },
      ],
    });
  });

  const heading = (harness: RouterTestingHarness) =>
    harness.routeNativeElement?.querySelector('#results-heading')?.textContent?.trim();

  async function searchFor(harness: RouterTestingHarness, query: string): Promise<void> {
    const input = harness.routeNativeElement!.querySelector('input')!;
    input.value = query;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await harness.fixture.whenStable();
  }

  it('shows trending when there is no query', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect(client.trending$).toHaveBeenCalledWith({ offset: 0 });
    expect(heading(harness)).toBe('Trending now');
  });

  it('searches the ?q query parameter and shows it in the field', async () => {
    const harness = await RouterTestingHarness.create('/?q=cats');

    expect(client.search$).toHaveBeenCalledWith({
      q: 'cats',
      offset: 0,
    });
    expect(heading(harness)).toBe('Results for “cats”');
    expect(harness.routeNativeElement!.querySelector('input')!.value).toBe('cats');
  });

  it('puts a submitted query into the URL', async () => {
    const harness = await RouterTestingHarness.create('/');

    await searchFor(harness, 'dogs');

    expect(TestBed.inject(Router).url).toBe('/?q=dogs');
    expect(client.search$).toHaveBeenCalledWith({
      q: 'dogs',
      offset: 0,
    });
  });

  it('drops the query from the URL when the field is cleared', async () => {
    const harness = await RouterTestingHarness.create('/?q=cats');

    await searchFor(harness, '');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(heading(harness)).toBe('Trending now');
  });

  it('explains when a search finds nothing', async () => {
    client.search$.mockReturnValue(of(buildListResponse([], 0)));

    const harness = await RouterTestingHarness.create('/?q=zzzz');

    expect(harness.routeNativeElement?.textContent).toContain('Nothing found for “zzzz”');
  });
});
