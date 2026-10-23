import { Clipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { buildGif } from '../../../../../../../testing/gif-builders';
import { FileDownloadService } from '../../../../../../core/services/browser/file-download.service';
import { GifActionsService } from './gif-actions.service';

describe('GifActionsService', () => {
  let service: GifActionsService;
  let clipboard: { copy: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let snackBarAction$: Subject<void>;
  let fileDownload: { download$: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clipboard = { copy: vi.fn(() => true) };
    snackBarAction$ = new Subject<void>();
    snackBar = { open: vi.fn(() => ({ onAction: () => snackBarAction$ })) };
    fileDownload = { download$: vi.fn(() => of(undefined)) };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Clipboard,
          useValue: clipboard,
        },
        {
          provide: MatSnackBar,
          useValue: snackBar,
        },
        {
          provide: FileDownloadService,
          useValue: fileDownload,
        },
      ],
    });
    service = TestBed.inject(GifActionsService);
  });

  it('copies the direct media link and confirms it', () => {
    service.copyMediaLink(buildGif());

    expect(clipboard.copy).toHaveBeenCalledWith('https://media.test/giphy.gif');
    expect(snackBar.open).toHaveBeenCalledWith('Link copied', undefined, { duration: 3000 });
  });

  it('copies the GIPHY page link and confirms it', () => {
    service.copyPageLink(buildGif());

    expect(clipboard.copy).toHaveBeenCalledWith('https://giphy.com/gifs/happy-cat-abc');
    expect(snackBar.open).toHaveBeenCalledWith('Link copied', undefined, { duration: 3000 });
  });

  it('says so when the browser refuses to copy', () => {
    clipboard.copy.mockReturnValue(false);

    service.copyMediaLink(buildGif());

    expect(snackBar.open).toHaveBeenCalledWith('Couldn’t copy the link. Try again.', undefined, {
      duration: 3000,
    });
  });

  it.each([
    ['happy-cat-abc', 'abc', 'happy-cat-abc.gif'],
    ['happy-cat', 'abc', 'happy-cat-abc.gif'],
    ['abc', 'abc', 'gif-abc.gif'],
    ['', 'abc', 'gif-abc.gif'],
  ])('downloads the original GIF from slug %j and id %j as %s', async (slug, id, fileName) => {
    await firstValueFrom(
      service.download$(
        buildGif({
          slug,
          id,
        }),
      ),
    );

    expect(fileDownload.download$).toHaveBeenCalledWith('https://media.test/giphy.gif', fileName);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('offers to open the GIF in a new tab when the download fails', async () => {
    fileDownload.download$.mockReturnValue(throwError(() => new Error('Failed to fetch')));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    const completed = await firstValueFrom(service.download$(buildGif()), { defaultValue: 'completed' });

    expect(completed).toBe('completed');
    expect(snackBar.open).toHaveBeenCalledWith('Couldn’t download the GIF.', 'Open in new tab', {
      duration: 8000,
    });
    expect(open).not.toHaveBeenCalled();

    snackBarAction$.next();

    expect(open).toHaveBeenCalledWith('https://media.test/giphy.gif', '_blank', 'noopener');
  });
});
