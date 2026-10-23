import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { buildGif } from '../../../../../../../../testing/gif-builders';
import { buildGifDto } from '../../../../../../../../testing/giphy-builders';
import { IGiphyGif } from '../../../../../../../core/entities/giphy/gif.dto';
import { IGiphySingleResponse } from '../../../../../../../core/entities/giphy/giphy-response.dto';
import { GiphyApiError } from '../../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../../core/services/api/giphy/gifs.client';
import { TGif } from '../../../../../models/gif.types';
import { GifDetailsModalFacade } from '../../../data-access/facades/gif-details-modal.facade';
import { GifActionsService } from '../../../data-access/services/gif-actions.service';

describe('GifDetailsModalComponent', () => {
  let gifActions: {
    copyMediaLink: ReturnType<typeof vi.fn>;
    copyPageLink: ReturnType<typeof vi.fn>;
    download$: ReturnType<typeof vi.fn>;
  };
  let download$: Subject<void>;
  let byId$: Subject<IGiphySingleResponse<IGiphyGif>>;

  beforeEach(() => {
    download$ = new Subject<void>();
    byId$ = new Subject();
    gifActions = {
      copyMediaLink: vi.fn(),
      copyPageLink: vi.fn(),
      download$: vi.fn(() => download$),
    };
    TestBed.configureTestingModule({
      providers: [
        GifDetailsModalFacade,
        {
          provide: GifActionsService,
          useValue: gifActions,
        },
        {
          provide: GifsClient,
          useValue: { getById$: () => byId$ },
        },
        // Closing then completes at once instead of waiting for the exit animation.
        {
          provide: MATERIAL_ANIMATIONS,
          useValue: { animationsDisabled: true },
        },
      ],
    });
  });

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  /** Opens the real dialog through the facade and returns its container. */
  async function openDialog(gif: TGif): Promise<HTMLElement> {
    return openById(gif.id, gif);
  }

  /** Opens the dialog by id; without a GIF, it is loaded through the mocked client. */
  async function openById(id: string, gif: TGif | null = null): Promise<HTMLElement> {
    TestBed.inject(GifDetailsModalFacade).open(id, gif);
    await settle();
    return document.querySelector<HTMLElement>('mat-dialog-container')!;
  }

  const titleOf = (container: HTMLElement) => container.querySelector('[mat-dialog-title]');

  /** The `<dd>` that follows the `<dt>` with the given label. */
  function detail(container: HTMLElement, label: string): HTMLElement {
    const term = [...container.querySelectorAll('dt')].find((dt) => dt.textContent?.trim() === label);
    return term!.nextElementSibling as HTMLElement;
  }

  /** The action button whose text ends with the label (the text starts with its icon name). */
  function actionButton(container: HTMLElement, label: string): HTMLButtonElement {
    return [...container.querySelectorAll<HTMLButtonElement>('mat-dialog-actions button')].find((button) =>
      button.textContent?.trim().endsWith(label),
    )!;
  }

  it('shows the full-size GIF over its still frame, labelled by the title', async () => {
    const container = await openDialog(buildGif());

    const title = container.querySelector('[mat-dialog-title]')!;
    expect(title.textContent?.trim()).toBe('Happy Cat');
    expect(container.getAttribute('aria-labelledby')).toBe(title.id);

    const [still, animated] = container.querySelectorAll('mat-dialog-content img');
    expect(still!.getAttribute('src')).toBe('https://media.test/giphy_s.gif');
    expect(still!.getAttribute('alt')).toBe('');
    expect(animated!.getAttribute('src')).toBe('https://media.test/giphy.gif');
    expect(animated!.getAttribute('alt')).toBe('A cat smiling');
    expect(animated!.getAttribute('width')).toBe('480');
    expect(animated!.getAttribute('height')).toBe('270');
  });

  it('lists the author, date, rating, dimensions, size and source', async () => {
    const container = await openDialog(buildGif());

    const authorLink = detail(container, 'Author').querySelector('a')!;
    expect(authorLink.textContent?.trim()).toBe('Cat Lover');
    expect(authorLink.href).toBe('https://giphy.com/catlover/');
    expect(detail(container, 'Author').querySelector('img')!.getAttribute('src')).toBe(
      'https://media.test/avatar.gif',
    );
    expect(detail(container, 'Created').textContent?.trim()).toBe('May 17, 2024');
    expect(detail(container, 'Rating').textContent?.trim()).toBe('PG-13');
    expect(detail(container, 'Dimensions').textContent?.trim()).toBe('480 × 270 px');
    expect(detail(container, 'File size').textContent?.trim()).toBe('1.5 MB');

    const sourceLink = detail(container, 'Source').querySelector('a')!;
    expect(sourceLink.textContent?.trim()).toBe('reddit.com');
    expect(sourceLink.href).toBe('https://www.reddit.com/r/cats/123');
  });

  it('links to the GIF on GIPHY in a new tab', async () => {
    const container = await openDialog(buildGif());

    const link = container.querySelector<HTMLAnchorElement>('mat-dialog-actions a')!;
    expect(link.textContent).toContain('Open on GIPHY');
    expect(link.href).toBe('https://giphy.com/gifs/happy-cat-abc');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  });

  it('copies the media link and the GIPHY page link', async () => {
    const gif = buildGif();
    const container = await openDialog(gif);

    actionButton(container, 'Copy link').click();
    expect(gifActions.copyMediaLink).toHaveBeenCalledWith(gif);

    actionButton(container, 'Copy GIPHY page link').click();
    expect(gifActions.copyPageLink).toHaveBeenCalledWith(gif);
  });

  it('downloads the GIF, showing a spinner and staying focusable but disabled meanwhile', async () => {
    const gif = buildGif();
    const container = await openDialog(gif);

    actionButton(container, 'Download').click();
    await settle();

    expect(gifActions.download$).toHaveBeenCalledWith(gif);
    const busyButton = actionButton(container, 'Downloading…');
    expect(busyButton.querySelector('mat-progress-spinner')).not.toBeNull();
    expect(busyButton.getAttribute('aria-disabled')).toBe('true');
    expect(busyButton.disabled).toBe(false);

    download$.complete();
    await settle();

    expect(actionButton(container, 'Download').getAttribute('aria-disabled')).not.toBe('true');
    expect(container.querySelector('mat-progress-spinner')).toBeNull();
  });

  it('says what is unknown when Giphy has no author, date, size or source', async () => {
    const gif = buildGif();
    const container = await openDialog({
      ...gif,
      author: null,
      createdAt: null,
      sourceUrl: null,
      original: {
        ...gif.original,
        size: null,
      },
    });

    expect(detail(container, 'Author').textContent?.trim()).toBe('Unknown author');
    expect(detail(container, 'Created').textContent?.trim()).toBe('Unknown');
    expect(detail(container, 'File size').textContent?.trim()).toBe('Unknown');
    expect(detail(container, 'Source').textContent?.trim()).toBe('Unknown');
  });

  it('shows an author without a profile as plain text', async () => {
    const container = await openDialog(
      buildGif({
        author: {
          name: 'anonymous',
          username: 'anonymous',
          avatarUrl: null,
          profileUrl: null,
        },
      }),
    );

    const author = detail(container, 'Author');
    expect(author.textContent?.trim()).toBe('anonymous');
    expect(author.querySelector('a, img')).toBeNull();
  });

  it('closes from the close button', async () => {
    const container = await openDialog(buildGif());

    container.querySelector<HTMLButtonElement>('button[aria-label="Close details"]')!.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
  });

  it('shows a labelled loading state while a GIF opened by id loads, then the GIF', async () => {
    const container = await openById('remote');

    expect(titleOf(container)!.textContent?.trim()).toBe('Loading GIF…');
    expect(container.getAttribute('aria-labelledby')).toBe(titleOf(container)!.id);
    expect(container.querySelector('[role="status"] mat-progress-spinner')).not.toBeNull();

    byId$.next({
      data: buildGifDto('remote'),
      meta: {
        status: 200,
        msg: 'OK',
        response_id: 'r',
      },
    });
    await settle();

    expect(titleOf(container)!.textContent?.trim()).toBe('GIF remote');
    expect(container.getAttribute('aria-labelledby')).toBe(titleOf(container)!.id);
  });

  it('says when the GIF does not exist, without offering a retry', async () => {
    const container = await openById('missing');

    byId$.error(new GiphyApiError('unknown', 404, 'Not Found'));
    await settle();

    expect(titleOf(container)!.textContent?.trim()).toBe('GIF not found');
    expect(container.querySelector('[role="alert"]')!.textContent).toContain('removed from GIPHY');
    expect(container.querySelector('mat-dialog-actions')).toBeNull();
  });

  it('explains other failures and retries them', async () => {
    const container = await openById('remote');
    byId$.error(new GiphyApiError('network', 0, 'Offline'));
    await settle();

    expect(titleOf(container)!.textContent?.trim()).toBe('You seem to be offline');

    byId$ = new Subject();
    actionButton(container, 'Try again').click();
    await settle();

    expect(titleOf(container)!.textContent?.trim()).toBe('Loading GIF…');
  });
});
