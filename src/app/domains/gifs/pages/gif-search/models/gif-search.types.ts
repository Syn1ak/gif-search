import { TGifFeedMode } from '../../../../../core/models/giphy-config.types';
import { TGiphyErrorKind } from '../../../../../core/models/giphy-error';
import { TGif } from '../../../models/gif.types';

export type TGifSearchStatus = 'idle' | 'loading' | 'loading-more' | 'loaded' | 'error';

export type TGifSearchState = {
  query: string;
  mode: TGifFeedMode;
  items: TGif[];
  /** Offset of the next page. */
  offset: number;
  total: number;
  status: TGifSearchStatus;
  error: TGiphyErrorKind | null;
};

/** What to show instead of the grid. */
export type TResultsState =
  | {
      kind: 'empty';
      query: string;
    }
  | {
      kind: 'error';
      error: TGiphyErrorKind;
    };
