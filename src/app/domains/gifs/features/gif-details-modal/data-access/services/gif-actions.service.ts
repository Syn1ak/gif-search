import { Clipboard } from '@angular/cdk/clipboard';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, EMPTY, Observable } from 'rxjs';
import { FileDownloadService } from '../../../../../../core/services/browser/file-download.service';
import { TGif } from '../../../../models/gif.types';

const SNACKBAR_DURATION_MS = 3000;
/** Longer, so there is time to reach the "Open in new tab" action. */
const ACTION_SNACKBAR_DURATION_MS = 8000;
const COPIED_MESSAGE = 'Link copied';
const COPY_FAILED_MESSAGE = 'Couldn’t copy the link. Try again.';
const DOWNLOAD_FAILED_MESSAGE = 'Couldn’t download the GIF.';
const OPEN_IN_NEW_TAB_ACTION = 'Open in new tab';
const FALLBACK_FILE_BASE = 'gif';

/** What a user can do with a GIF, with a snackbar reporting the outcome. */
@Injectable({ providedIn: 'root' })
export class GifActionsService {
  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly document = inject(DOCUMENT);

  /** Copies the direct `.gif` media URL. */
  copyMediaLink(gif: TGif): void {
    this.copy(gif.original.url);
  }

  /** Copies the GIF's page on giphy.com. */
  copyPageLink(gif: TGif): void {
    this.copy(gif.pageUrl);
  }

  /**
   * Saves the original GIF as `<slug>-<id>.gif`. Completes either way: a failure is reported in a snackbar
   * that offers to open the GIF in a new tab instead.
   */
  download$(gif: TGif): Observable<void> {
    return this.fileDownload.download$(gif.original.url, toFileName(gif)).pipe(
      catchError(() => {
        this.offerToOpenInNewTab(gif);
        return EMPTY;
      }),
    );
  }

  private copy(text: string): void {
    const copied = this.clipboard.copy(text);

    this.snackBar.open(copied ? COPIED_MESSAGE : COPY_FAILED_MESSAGE, undefined, {
      duration: SNACKBAR_DURATION_MS,
    });
  }

  private offerToOpenInNewTab(gif: TGif): void {
    this.snackBar
      .open(DOWNLOAD_FAILED_MESSAGE, OPEN_IN_NEW_TAB_ACTION, { duration: ACTION_SNACKBAR_DURATION_MS })
      .onAction()
      .subscribe(() => this.document.defaultView?.open(gif.original.url, '_blank', 'noopener'));
  }
}

/** Giphy slugs usually end with the id already (`happy-cat-abc123`); it is not repeated. */
function toFileName({ slug, id }: TGif): string {
  const base = slug.endsWith(`-${id}`) ? slug.slice(0, -(id.length + 1)) : slug;
  const name = base && base !== id ? base : FALLBACK_FILE_BASE;

  return `${name}-${id}.gif`;
}
