import { inject, Injectable, Injector, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TGif } from '../../../../models/gif.types';
import { GifDetailsModalComponent } from '../../view/components/gif-details-modal/gif-details-modal.component';

/** Styles the overlay pane in styles.scss: wide on desktop, full-screen below `sm`. */
const PANEL_CLASS = 'app-gif-details-dialog';

/** Opens the GIF details dialog and holds the GIF it shows. Provided by each page that uses it. */
@Injectable()
export class GifDetailsModalFacade {
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  private readonly $state = signal<TGif | null>(null);

  readonly $gif = this.$state.asReadonly();

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
}
