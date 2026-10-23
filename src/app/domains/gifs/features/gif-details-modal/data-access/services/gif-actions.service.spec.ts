import { Clipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buildGif } from '../../../../../../../testing/gif-builders';
import { GifActionsService } from './gif-actions.service';

describe('GifActionsService', () => {
  let service: GifActionsService;
  let clipboard: { copy: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clipboard = { copy: vi.fn(() => true) };
    snackBar = { open: vi.fn() };
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
});
