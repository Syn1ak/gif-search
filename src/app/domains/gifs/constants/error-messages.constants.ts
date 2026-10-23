import { TGiphyErrorKind } from '../../../core/models/giphy-error';

export type TErrorMessage = {
  icon: string;
  title: string;
  hint: string;
  /** Unauthorized cannot be fixed by retrying, every other kind can. */
  retryable: boolean;
};

export const ERROR_MESSAGES: Record<TGiphyErrorKind, TErrorMessage> = {
  unauthorized: {
    icon: 'key_off',
    title: 'API key is missing or invalid',
    hint: 'GIPHY rejected the request. Check GIPHY_API_KEY and reload the page.',
    retryable: false,
  },
  'rate-limited': {
    icon: 'hourglass_empty',
    title: 'Rate limit reached',
    hint: 'GIPHY allows a limited number of requests per hour. Try again in a few minutes.',
    retryable: true,
  },
  network: {
    icon: 'wifi_off',
    title: 'You seem to be offline',
    hint: 'Check your connection and try again.',
    retryable: true,
  },
  unknown: {
    icon: 'error',
    title: 'Something went wrong',
    hint: 'GIPHY did not respond as expected. Try again.',
    retryable: true,
  },
};
