/** A single rendition of a GIF. Giphy sends every number as a string. */
export interface IGiphyRendition {
  url?: string;
  width: string;
  height: string;
  size?: string;
  webp?: string;
  webp_size?: string;
  mp4?: string;
  mp4_size?: string;
  frames?: string;
}

/** Renditions are optional: Giphy omits the ones it could not generate. */
export interface IGiphyImages {
  original?: IGiphyRendition;
  original_still?: IGiphyRendition;
  fixed_width?: IGiphyRendition;
  fixed_width_still?: IGiphyRendition;
  fixed_height?: IGiphyRendition;
  fixed_height_still?: IGiphyRendition;
  downsized?: IGiphyRendition;
  downsized_medium?: IGiphyRendition;
  downsized_large?: IGiphyRendition;
  downsized_still?: IGiphyRendition;
  preview_gif?: IGiphyRendition;
}

export interface IGiphyUser {
  username: string;
  display_name: string;
  avatar_url: string;
  profile_url: string;
  banner_url?: string;
  description?: string;
  is_verified?: boolean;
}

export interface IGiphyGif {
  type: string;
  id: string;
  slug: string;
  url: string;
  embed_url: string;
  bitly_url?: string;
  username: string;
  title: string;
  alt_text?: string;
  rating: string;
  source: string;
  source_tld: string;
  source_post_url: string;
  /** `YYYY-MM-DD HH:mm:ss`, or `0000-00-00 00:00:00` when unknown. */
  import_datetime: string;
  trending_datetime: string;
  user?: IGiphyUser;
  images: IGiphyImages;
}
