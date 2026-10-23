export type TGifFeedMode = 'search' | 'trending';

export type TGiphyRating = 'g' | 'pg' | 'pg-13' | 'r';

export type TGiphyConfig = {
  apiKey: string;
  baseUrl: string;
  pageSize: number;
  rating: TGiphyRating;
  lang: string;
  /** Highest `offset` each endpoint accepts. */
  offsetCap: Record<TGifFeedMode, number>;
};
