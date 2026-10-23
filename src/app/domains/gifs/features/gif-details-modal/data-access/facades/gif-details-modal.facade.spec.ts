import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { buildGif } from '../../../../../../../testing/gif-builders';
import { GifActionsService } from '../services/gif-actions.service';
import { GifDetailsModalFacade } from './gif-details-modal.facade';

describe('GifDetailsModalFacade', () => {
  let facade: GifDetailsModalFacade;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GifDetailsModalFacade,
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

  it('opens the dialog for a GIF', async () => {
    facade.open(buildGif());
    await settle();

    expect(dialog.openDialogs).toHaveLength(1);
    expect(facade.$gif()?.id).toBe('abc');
    expect(dialogTitle()).toBe('Happy Cat');
  });

  it('reuses the open dialog and shows the newly opened GIF', async () => {
    facade.open(buildGif());
    facade.open(
      buildGif({
        id: 'xyz',
        title: 'Sleepy Dog',
      }),
    );
    await settle();

    expect(dialog.openDialogs).toHaveLength(1);
    expect(dialogTitle()).toBe('Sleepy Dog');
  });

  it('forgets the GIF once the dialog is closed, and opens a fresh one next time', async () => {
    facade.open(buildGif());
    dialog.closeAll();
    await settle();

    expect(facade.$gif()).toBeNull();
    expect(dialog.openDialogs).toHaveLength(0);

    facade.open(buildGif());

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
