import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { buildGif } from '../../../../../../../testing/gif-builders';
import { buildGifDto } from '../../../../../../../testing/giphy-builders';
import { GiphyApiError } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import { GifActionsService } from '../services/gif-actions.service';
import { GifDetailsModalFacade } from './gif-details-modal.facade';

describe('GifDetailsModalFacade', () => {
  let facade: GifDetailsModalFacade;
  let dialog: MatDialog;
  let client: { getById$: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    client = {
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
        GifDetailsModalFacade,
        {
          provide: GifsClient,
          useValue: client,
        },
        // Closing then completes at once instead of waiting for the exit animation.
        {
          provide: MATERIAL_ANIMATIONS,
          useValue: { animationsDisabled: true },
        },
      ],
    });
    facade = TestBed.inject(GifDetailsModalFacade);
    dialog = TestBed.inject(MatDialog);
  });

  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const dialogTitle = () => document.querySelector('[mat-dialog-title]')?.textContent?.trim();
  const apiError = (status: number, kind: GiphyApiError['kind'] = 'unknown') =>
    throwError(() => new GiphyApiError(kind, status, 'failed'));

  it('opens the dialog for a GIF the page already has, without loading it', async () => {
    facade.open('abc', buildGif());
    await settle();

    expect(dialog.openDialogs).toHaveLength(1);
    expect(facade.$status()).toBe('loaded');
    expect(facade.$gif()?.id).toBe('abc');
    expect(dialogTitle()).toBe('Happy Cat');
    expect(client.getById$).not.toHaveBeenCalled();
  });

  it('reuses the open dialog and shows the newly opened GIF', async () => {
    facade.open('abc', buildGif());
    facade.open(
      'xyz',
      buildGif({
        id: 'xyz',
        title: 'Sleepy Dog',
      }),
    );
    await settle();

    expect(dialog.openDialogs).toHaveLength(1);
    expect(dialogTitle()).toBe('Sleepy Dog');
  });

  it('loads a GIF by id when the page does not have it', () => {
    facade.open('remote');

    expect(client.getById$).toHaveBeenCalledWith('remote');
    expect(facade.$status()).toBe('loaded');
    expect(facade.$gif()?.title).toBe('GIF remote');
  });

  it('shows the loading state until the GIF arrives', () => {
    client.getById$.mockReturnValue(NEVER);

    facade.open('slow');

    expect(facade.$status()).toBe('loading');
    expect(facade.$gif()).toBeNull();
  });

  it('does not load the GIF again when it is already shown', () => {
    facade.open('remote');
    facade.open('remote');

    expect(client.getById$).toHaveBeenCalledTimes(1);
  });

  it('drops a pending load when the GIF is handed over meanwhile', () => {
    const response$ = new Subject<never>();
    client.getById$.mockReturnValue(response$);

    facade.open('abc');
    facade.open('abc', buildGif());

    expect(response$.observed).toBe(false);
    expect(facade.$gif()?.title).toBe('Happy Cat');
  });

  it.each([
    ['a 404', () => apiError(404)],
    ['a 400 for a malformed id', () => apiError(400)],
    [
      'an empty data',
      () =>
        of({
          data: [],
          meta: {
            status: 200,
            msg: 'OK',
            response_id: 'r',
          },
        }),
    ],
    [
      'a GIF without usable renditions',
      () =>
        of({
          data: buildGifDto('broken', false),
          meta: {
            status: 200,
            msg: 'OK',
            response_id: 'r',
          },
        }),
    ],
  ])('reports not-found for %s', (_, response) => {
    client.getById$.mockReturnValue(response());

    facade.open('missing');

    expect(facade.$status()).toBe('error');
    expect(facade.$error()).toBe('not-found');
  });

  it('reports other failures by their kind, and retries them', () => {
    client.getById$.mockReturnValueOnce(apiError(0, 'network'));

    facade.open('remote');

    expect(facade.$error()).toBe('network');

    facade.retry();

    expect(client.getById$).toHaveBeenCalledTimes(2);
    expect(facade.$gif()?.id).toBe('remote');
  });

  it('reports a non-Giphy failure as unknown', () => {
    client.getById$.mockReturnValue(throwError(() => new Error('boom')));

    facade.open('remote');

    expect(facade.$error()).toBe('unknown');
  });

  it('closes on request, forgets the GIF and announces it', async () => {
    const closed: void[] = [];
    facade.closed$.subscribe(() => closed.push(undefined));
    facade.open('abc', buildGif());

    facade.close();
    await settle();

    expect(dialog.openDialogs).toHaveLength(0);
    expect(facade.$status()).toBe('closed');
    expect(closed).toHaveLength(1);

    facade.open('abc', buildGif());

    expect(dialog.openDialogs).toHaveLength(1);
  });

  it('copies links through the GIF actions', () => {
    const gifActions = TestBed.inject(GifActionsService);
    const copyMediaLink = vi.spyOn(gifActions, 'copyMediaLink').mockImplementation(() => undefined);
    const copyPageLink = vi.spyOn(gifActions, 'copyPageLink').mockImplementation(() => undefined);
    const gif = buildGif();

    facade.copyMediaLink(gif);
    facade.copyPageLink(gif);

    expect(copyMediaLink).toHaveBeenCalledWith(gif);
    expect(copyPageLink).toHaveBeenCalledWith(gif);
  });

  it('tracks the running download and starts no second one meanwhile', () => {
    const download$ = new Subject<void>();
    const startDownload = vi.spyOn(TestBed.inject(GifActionsService), 'download$').mockReturnValue(download$);

    facade.download(buildGif());
    facade.download(buildGif({ id: 'xyz' }));

    expect(startDownload).toHaveBeenCalledTimes(1);
    expect(facade.$downloadingGifId()).toBe('abc');

    download$.complete();

    expect(facade.$downloadingGifId()).toBeNull();
  });
});
