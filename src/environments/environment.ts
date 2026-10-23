import { GENERATED_ENV } from './environment.generated';

export const environment = {
  giphyApiKey: GENERATED_ENV.giphyApiKey,
  giphyApiUrl: 'https://api.giphy.com/v1',
} as const;
