import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { buildGifDto, buildListResponse } from '../../../../../../testing/giphy-builders';
import { GifsClient } from '../../../../../core/services/api/giphy/gifs.client';
import { GifActionsService } from '../../../features/gif-details-modal/data-access/services/gif-actions.service';
import { ROUTES } from '../gif-search.routes';

describe('GifSearchComponent', () => {
  let client: {
    trending$: ReturnType<typeof vi.fn>;
    search$: ReturnType<typeof vi.fn>;
    getById$: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // jsdom has no IntersectionObserver; the grid's infinite-scroll sentinel creates one after render.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    client = {
      trending$: vi.fn(() => of(buildListResponse([buildGifDto('trend')]))),
      search$: vi.fn(() => of(buildListResponse([buildGifDto('found')]))),
      getById$: vi.fn((id: string) =>
        of({
          data: buildGifDto(id),
          meta: {
            status: 200,
            msg: 'OK',
            response_id: 'r',
          },
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ROUTES, withComponentInputBinding()),
        provideLocationMocks(),
        {
          provide: GifsClient,
          useValue: client,
        },
        // Closing the dialog then completes at once instead of waiting for the exit animation.
        {
          provide: MATERIAL_ANIMATIONS,
          useValue: { animationsDisabled: true },
        },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

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

  const dialogTitle = () =>
    document.querySelector('mat-dialog-container [mat-dialog-title]')?.textContent?.trim() ?? null;

  async function closeDialog(harness: RouterTestingHarness): Promise<void> {
    document.querySelector<HTMLButtonElement>('button[aria-label="Close details"]')!.click();
    await harness.fixture.whenStable();
  }

  it('opens a clicked card through ?gif, with the GIF from the grid', async () => {
    const harness = await RouterTestingHarness.create('/');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('app-gif-card button')!.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/?gif=trend');
    expect(dialogTitle()).toBe('GIF trend');
    expect(client.getById$).not.toHaveBeenCalled();
  });

  it('steps back in history when the user closes a dialog the page opened', async () => {
    const harness = await RouterTestingHarness.create('/');
    // A bootstrapped app does this on start; without it the router ignores Back (popstate).
    TestBed.inject(Router).setUpLocationChangeListener();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('app-gif-card button')!.click();
    await harness.fixture.whenStable();

    await closeDialog(harness);
    // The router handles Back (popstate) on a later macrotask.
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
    expect(dialogTitle()).toBeNull();
  });

  it('restores a deep link: the search, and the GIF loaded by id', async () => {
    await RouterTestingHarness.create('/?q=cats&gif=remote');

    expect(client.search$).toHaveBeenCalledWith({
      q: 'cats',
      offset: 0,
    });
    expect(client.getById$).toHaveBeenCalledWith('remote');
    expect(dialogTitle()).toBe('GIF remote');
  });

  it('drops ?gif in place when the user closes a deep-linked dialog', async () => {
    const harness = await RouterTestingHarness.create('/?q=cats&gif=remote');

    await closeDialog(harness);

    expect(TestBed.inject(Router).url).toBe('/?q=cats');
  });

  it('closes the dialog when ?gif leaves the URL', async () => {
    const harness = await RouterTestingHarness.create('/?gif=remote');

    await harness.navigateByUrl('/');

    expect(dialogTitle()).toBeNull();
  });

  it('copies a card’s media link from its quick copy button without opening the dialog', async () => {
    const copyMediaLink = vi
      .spyOn(TestBed.inject(GifActionsService), 'copyMediaLink')
      .mockImplementation(() => undefined);
    const harness = await RouterTestingHarness.create('/');

    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('button[aria-label^="Copy link to"]')!
      .click();
    await harness.fixture.whenStable();

    expect(copyMediaLink).toHaveBeenCalledWith(expect.objectContaining({ id: 'trend' }));
    expect(document.querySelector('mat-dialog-container')).toBeNull();
  });
});
