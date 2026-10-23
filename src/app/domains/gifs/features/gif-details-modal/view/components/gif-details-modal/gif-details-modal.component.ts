import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ERROR_MESSAGES, TErrorMessage } from '../../../../../constants/error-messages.constants';
import { GifDetailsModalFacade } from '../../../data-access/facades/gif-details-modal.facade';
import { GifMetaListComponent } from '../gif-meta-list/gif-meta-list.component';

const NOT_FOUND_MESSAGE: TErrorMessage = {
  icon: 'image_not_supported',
  title: 'GIF not found',
  hint: 'It may have been removed from GIPHY, or the link is wrong.',
  retryable: false,
};

/**
 * Dialog content: the full-size GIF, its details and links, or the loading and error states of a GIF
 * opened by id. `mat-dialog-title` labels the dialog in every state.
 */
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

  protected readonly $errorMessage = computed((): TErrorMessage | null => {
    const error = this.facade.$error();

    if (!error) {
      return null;
    }

    return error === 'not-found' ? NOT_FOUND_MESSAGE : ERROR_MESSAGES[error];
  });
}
