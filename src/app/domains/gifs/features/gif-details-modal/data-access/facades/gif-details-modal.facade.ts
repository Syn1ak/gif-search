import { computed, DestroyRef, inject, Injectable, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { catchError, EMPTY, finalize, map, Observable, of, Subject, switchMap } from 'rxjs';
import { GiphyApiError, TGiphyErrorKind } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import { TGif } from '../../../../models/gif.types';
import { toGif } from '../../../../utils/gif.mapper';
import { GifDetailsModalComponent } from '../../view/components/gif-details-modal/gif-details-modal.component';
import { GifActionsService } from '../services/gif-actions.service';

export type TGifDetailsError = TGiphyErrorKind | 'not-found';

type TGifDetailsState =
  | { status: 'closed' }
  | { status: 'loading'; id: string }
  | { status: 'loaded'; gif: TGif }
  | { status: 'error'; id: string; error: TGifDetailsError };

const CLOSED: TGifDetailsState = { status: 'closed' };
/** Styles the overlay pane in styles.scss: wide on desktop, full-screen below `sm`. */
const PANEL_CLASS = 'app-gif-details-dialog';
/** Giphy answers a malformed id with 400 and an unknown one with 404. */
const NOT_FOUND_STATUSES: readonly number[] = [400, 404];

/**
 * Opens the GIF details dialog, holds the GIF it shows (loading it by id when the page does not have it),
 * and runs the GIF actions (copy links, download) for the dialog and for the page's cards.
 * Provided by each page that uses it.
 */
@Injectable()
export class GifDetailsModalFacade {
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gifsClient = inject(GifsClient);
  private readonly gifActions = inject(GifActionsService);

  private readonly $state = signal<TGifDetailsState>(CLOSED);
  private readonly $downloadingId = signal<string | null>(null);

  readonly $status = computed(() => this.$state().status);
  readonly $gif = computed(() => {
    const state = this.$state();
    return state.status === 'loaded' ? state.gif : null;
  });
  readonly $error = computed(() => {
    const state = this.$state();
    return state.status === 'error' ? state.error : null;
  });
  /** Id of the GIF being downloaded, or null. */
  readonly $downloadingGifId = this.$downloadingId.asReadonly();

  /** A null request cancels the load in flight. */
  private readonly request$ = new Subject<string | null>();
  private readonly closedSubject = new Subject<void>();

  /** Emits each time the dialog closes, whether the user closed it or `close()` was called. */
  readonly closed$ = this.closedSubject.asObservable();

  private dialogRef: MatDialogRef<GifDetailsModalComponent> | null = null;

  constructor() {
    this.request$
      .pipe(
        switchMap((id) => (id ? this.fetch$(id) : EMPTY)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.$state.set(state));
  }

  /**
   * Shows the GIF with this id, reusing the dialog when it is already open. Pass the GIF when the page
   * already has it; otherwise it is loaded from Giphy.
   */
  open(id: string, gif: TGif | null = null): void {
    if (gif) {
      this.request$.next(null);
      this.$state.set({
        status: 'loaded',
        gif,
      });
    } else if (this.$gif()?.id !== id) {
      this.load(id);
    }

    this.openDialog();
  }

  close(): void {
    this.dialogRef?.close();
  }

  /** Loads the GIF again after a failed attempt. */
  retry(): void {
    const state = this.$state();

    if (state.status === 'error') {
      this.load(state.id);
    }
  }

  copyMediaLink(gif: TGif): void {
    this.gifActions.copyMediaLink(gif);
  }

  copyPageLink(gif: TGif): void {
    this.gifActions.copyPageLink(gif);
  }

  /** One download at a time; it keeps running if the dialog is closed meanwhile. */
  download(gif: TGif): void {
    if (this.$downloadingId()) {
      return;
    }

    this.$downloadingId.set(gif.id);
    this.gifActions
      .download$(gif)
      .pipe(
        finalize(() => this.$downloadingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private load(id: string): void {
    this.$state.set({
      status: 'loading',
      id,
    });
    this.request$.next(id);
  }

  private openDialog(): void {
    if (this.dialogRef) {
      return;
    }

    // The page's injector lets the dialog content inject this facade. Pages close the dialog from the
    // URL, so it must not also close itself on Back before the router has caught up.
    this.dialogRef = this.dialog.open(GifDetailsModalComponent, {
      injector: this.injector,
      panelClass: PANEL_CLASS,
      closeOnNavigation: false,
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
      this.request$.next(null);
      this.$state.set(CLOSED);
      this.closedSubject.next();
    });
  }

  private fetch$(id: string): Observable<TGifDetailsState> {
    return this.gifsClient.getById$(id).pipe(
      map(({ data }): TGifDetailsState => {
        // Giphy may also answer an unknown id with an empty `data` instead of a 404.
        const gif = data && !Array.isArray(data) ? toGif(data) : null;

        return gif
          ? {
              status: 'loaded',
              gif,
            }
          : {
              status: 'error',
              id,
              error: 'not-found',
            };
      }),
      catchError((error: unknown) =>
        of<TGifDetailsState>({
          status: 'error',
          id,
          error: toDetailsError(error),
        }),
      ),
    );
  }
}

function toDetailsError(error: unknown): TGifDetailsError {
  if (!(error instanceof GiphyApiError)) {
    return 'unknown';
  }

  return NOT_FOUND_STATUSES.includes(error.status) ? 'not-found' : error.kind;
}
