export type TGiphyErrorKind = 'unauthorized' | 'rate-limited' | 'network' | 'unknown';

/** The only error shape the UI sees for Giphy API calls (see giphyErrorInterceptor). */
export class GiphyApiError extends Error {
  override readonly name = 'GiphyApiError';

  constructor(
    readonly kind: TGiphyErrorKind,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function giphyErrorKindFromStatus(status: number): TGiphyErrorKind {
  if (status === 0) return 'network';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate-limited';
  return 'unknown';
}
