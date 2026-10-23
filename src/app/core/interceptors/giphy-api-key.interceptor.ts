import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GIPHY_CONFIG } from '../tokens/giphy-config.token';

/** Adds `api_key` to Giphy API calls only, so media and third-party requests never leak the key. */
export const giphyApiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiKey, baseUrl } = inject(GIPHY_CONFIG);

  if (!req.url.startsWith(`${baseUrl}/`)) {
    return next(req);
  }

  return next(req.clone({ setParams: { api_key: apiKey } }));
};
