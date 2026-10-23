import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TGif } from '../../../../models/gif.types';

const SNACKBAR_DURATION_MS = 3000;
const COPIED_MESSAGE = 'Link copied';
const COPY_FAILED_MESSAGE = 'Couldn’t copy the link. Try again.';

/** What a user can do with a GIF, with a snackbar reporting the outcome. */
@Injectable({ providedIn: 'root' })
export class GifActionsService {
  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);

  /** Copies the direct `.gif` media URL. */
  copyMediaLink(gif: TGif): void {
    this.copy(gif.original.url);
  }

  /** Copies the GIF's page on giphy.com. */
  copyPageLink(gif: TGif): void {
    this.copy(gif.pageUrl);
  }

  private copy(text: string): void {
    const copied = this.clipboard.copy(text);

    this.snackBar.open(copied ? COPIED_MESSAGE : COPY_FAILED_MESSAGE, undefined, {
      duration: SNACKBAR_DURATION_MS,
    });
  }
}
