export type TGifImage = {
  url: string;
  width: number;
  height: number;
};

/** Small animated rendition for the grid, with a still frame for reduced motion. */
export type TGifPreview = TGifImage & {
  stillUrl: string;
};

/** Full-size GIF used by the details modal, copy link and download. */
export type TGifOriginal = TGifImage & {
  stillUrl: string | null;
  /** Bytes, when Giphy reports it. */
  size: number | null;
};

export type TGifAuthor = {
  name: string;
  username: string;
  avatarUrl: string | null;
  profileUrl: string | null;
};

export type TGif = {
  id: string;
  slug: string;
  title: string;
  altText: string;
  rating: string;
  /** The GIF's page on giphy.com. */
  pageUrl: string;
  sourceUrl: string | null;
  createdAt: Date | null;
  author: TGifAuthor | null;
  preview: TGifPreview;
  original: TGifOriginal;
};
