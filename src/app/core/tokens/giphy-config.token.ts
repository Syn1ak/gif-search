import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TGiphyConfig } from '../models/giphy-config.types';

export const GIPHY_CONFIG = new InjectionToken<TGiphyConfig>('GIPHY_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiKey: environment.giphyApiKey,
    baseUrl: environment.giphyApiUrl,
    pageSize: 30,
    rating: 'g',
    lang: 'en',
    offsetCap: { search: 4999, trending: 499 },
  }),
});
