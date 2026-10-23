import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { FileDownloadService } from './file-download.service';

const URL_TO_FETCH = 'https://media.test/giphy.gif';
const OBJECT_URL = 'blob:http://localhost/123';

describe('FileDownloadService', () => {
  let service: FileDownloadService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let clickedLinks: HTMLAnchorElement[];

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn(() => Promise.resolve(new Response(new Blob(['GIF89a']), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
    // jsdom implements neither object URLs nor link navigation.
    URL.createObjectURL = vi.fn(() => OBJECT_URL);
    URL.revokeObjectURL = vi.fn();
    clickedLinks = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedLinks.push(this);
    });

    service = TestBed.inject(FileDownloadService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the file and saves it under the given name through a temporary link', async () => {
    await firstValueFrom(service.download$(URL_TO_FETCH, 'happy-cat-abc.gif'));

    expect(fetchMock).toHaveBeenCalledWith(
      URL_TO_FETCH,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0]!.href).toBe(OBJECT_URL);
    expect(clickedLinks[0]!.download).toBe('happy-cat-abc.gif');
    expect(clickedLinks[0]!.isConnected).toBe(false);
  });

  it('revokes the object URL once the browser has had the link', async () => {
    await firstValueFrom(service.download$(URL_TO_FETCH, 'happy-cat-abc.gif'));

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('fails without saving anything when the server answers with an error', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(firstValueFrom(service.download$(URL_TO_FETCH, 'x.gif'))).rejects.toThrow('HTTP 404');
    expect(clickedLinks).toHaveLength(0);
  });

  it('fails when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(firstValueFrom(service.download$(URL_TO_FETCH, 'x.gif'))).rejects.toThrow('Failed to fetch');
    expect(clickedLinks).toHaveLength(0);
  });

  it('aborts the request when unsubscribed', () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    service.download$(URL_TO_FETCH, 'x.gif').subscribe().unsubscribe();

    const { signal } = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(signal!.aborted).toBe(true);
  });
});
