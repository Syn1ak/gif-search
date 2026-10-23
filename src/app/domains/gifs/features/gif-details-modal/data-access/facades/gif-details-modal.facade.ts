import { DestroyRef, inject, Injectable, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { TGif } from '../../../../models/gif.types';
import { GifDetailsModalComponent } from '../../view/components/gif-details-modal/gif-details-modal.component';
import { GifActionsService } from '../services/gif-actions.service';

/** Styles the overlay pane in styles.scss: wide on desktop, full-screen below `sm`. */
const PANEL_CLASS = 'app-gif-details-dialog';

/**
 * Opens the GIF details dialog, holds the GIF it shows, and runs the GIF actions (copy links, download)
 * for the dialog and for the page's cards. Provided by each page that uses it.
 */
@Injectable()
export class GifDetailsModalFacade {
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gifActions = inject(GifActionsService);

  private readonly $state = signal<TGif | null>(null);
  private readonly $downloadingId = signal<string | null>(null);

  readonly $gif = this.$state.asReadonly();
  /** Id of the GIF being downloaded, or null. */
  readonly $downloadingGifId = this.$downloadingId.asReadonly();

  private dialogRef: MatDialogRef<GifDetailsModalComponent> | null = null;

  /** Shows the GIF, reusing the dialog when it is already open. */
  open(gif: TGif): void {
    this.$state.set(gif);

    if (this.dialogRef) {
      return;
    }

    // The page's injector lets the dialog content inject this facade.
    this.dialogRef = this.dialog.open(GifDetailsModalComponent, {
      injector: this.injector,
      panelClass: PANEL_CLASS,
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
      this.$state.set(null);
    });
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
}
