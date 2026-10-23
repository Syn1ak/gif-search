import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Saves a remote file under a chosen name. A plain `<a download>` ignores the name for cross-origin
 * URLs, so the file is fetched as a Blob first (the host must allow CORS) and saved from an object URL.
 */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);

  /** Emits once and completes when the browser has been handed the file; unsubscribing aborts the fetch. */
  download$(url: string, filename: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      const controller = new AbortController();

      fetch(url, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Download failed with HTTP ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          this.save(blob, filename);
          subscriber.next();
          subscriber.complete();
        })
        .catch((error: unknown) => subscriber.error(error));

      return () => controller.abort();
    });
  }

  private save(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    link.hidden = true;
    this.document.body.append(link);
    link.click();
    link.remove();

    // Revoked on the next task: some browsers read the URL only after click() returns.
    setTimeout(() => URL.revokeObjectURL(objectUrl));
  }
}
