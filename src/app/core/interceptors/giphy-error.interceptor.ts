import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { IGiphyMeta } from '../entities/giphy/giphy-response.dto';
import { GiphyApiError, giphyErrorKindFromStatus } from '../models/giphy-error';
import { GIPHY_CONFIG } from '../tokens/giphy-config.token';

/**
 * Normalises every Giphy API failure into a GiphyApiError, including "synthetic" responses:
 * HTTP 200 with an empty `meta.response_id`, which Giphy uses to report downstream problems.
 */
export const giphyErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const { baseUrl } = inject(GIPHY_CONFIG);

  if (!req.url.startsWith(`${baseUrl}/`)) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isSyntheticResponse(event.body)) {
        throw new GiphyApiError('unknown', event.status, 'Giphy returned a synthetic error response');
      }
      return event;
    }),
    catchError((error: unknown) => throwError(() => toGiphyApiError(error))),
  );
};

function isSyntheticResponse(body: unknown): boolean {
  const meta = (body as { meta?: Partial<IGiphyMeta> } | null)?.meta;
  return meta?.response_id === '';
}

function toGiphyApiError(error: unknown): GiphyApiError {
  if (error instanceof GiphyApiError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    return new GiphyApiError(giphyErrorKindFromStatus(error.status), error.status, error.message);
  }
  return new GiphyApiError('unknown', 0, String(error));
}
