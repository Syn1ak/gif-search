import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { GifDetailsModalFacade } from '../../../data-access/facades/gif-details-modal.facade';
import { GifMetaListComponent } from '../gif-meta-list/gif-meta-list.component';

/** Dialog content: the full-size GIF, its details and links. `mat-dialog-title` labels the dialog. */
@Component({
  selector: 'app-gif-details-modal',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    GifMetaListComponent,
  ],
  templateUrl: './gif-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifDetailsModalComponent {
  protected readonly facade = inject(GifDetailsModalFacade);

  protected readonly $isDownloading = computed(() => {
    const gif = this.facade.$gif();
    const downloadingId = this.facade.$downloadingGifId();

    return gif !== null && gif.id === downloadingId;
  });
}
