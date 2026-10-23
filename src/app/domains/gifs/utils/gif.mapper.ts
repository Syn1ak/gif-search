import { IGiphyGif, IGiphyImages, IGiphyRendition, IGiphyUser } from '../../../core/entities/giphy/gif.dto';
import { TGif, TGifAuthor, TGifOriginal, TGifPreview } from '../models/gif.types';

type TRenditionName = keyof IGiphyImages;

/** Grid preview candidates in order of preference, each with its matching still frame. */
const PREVIEW_RENDITIONS: readonly (readonly [TRenditionName, TRenditionName])[] = [
  ['fixed_width', 'fixed_width_still'],
  ['fixed_height', 'fixed_height_still'],
  ['downsized', 'downsized_still'],
  ['original', 'original_still'],
];

const FALLBACK_TITLE = 'GIF';
const UNKNOWN_DATETIME_PREFIX = '0000-00-00';

/** Maps a Giphy DTO to the view model, or null when the GIF has no usable original rendition. */
export function toGif(dto: IGiphyGif): TGif | null {
  const original = toOriginal(dto.images);
  const preview = toPreview(dto.images);

  if (!original || !preview) {
    return null;
  }

  const title = dto.title.trim() || FALLBACK_TITLE;

  return {
    id: dto.id,
    slug: dto.slug,
    title,
    altText: dto.alt_text?.trim() || title,
    rating: dto.rating,
    pageUrl: dto.url,
    sourceUrl: dto.source_post_url || dto.source || null,
    createdAt: parseGiphyDate(dto.import_datetime),
    author: toAuthor(dto.user, dto.username),
    preview,
    original,
  };
}

function toOriginal(images: IGiphyImages): TGifOriginal | null {
  const original = images.original;
  const size = toSize(original);

  if (!original?.url || !size) {
    return null;
  }

  return {
    url: original.url,
    stillUrl: images.original_still?.url ?? null,
    ...size,
    size: toPositiveNumber(original.size),
  };
}

function toPreview(images: IGiphyImages): TGifPreview | null {
  for (const [name, stillName] of PREVIEW_RENDITIONS) {
    const rendition = images[name];
    const url = rendition?.webp ?? rendition?.url;
    const size = toSize(rendition);

    if (url && size) {
      return { url, stillUrl: images[stillName]?.url ?? rendition?.url ?? url, ...size };
    }
  }

  return null;
}

function toAuthor(user: IGiphyUser | undefined, username: string): TGifAuthor | null {
  if (user) {
    return {
      name: user.display_name || user.username,
      username: user.username,
      avatarUrl: user.avatar_url || null,
      profileUrl: user.profile_url || null,
    };
  }

  return username ? { name: username, username, avatarUrl: null, profileUrl: null } : null;
}

/** Giphy dates look like `2024-05-17 10:20:30` (UTC), or `0000-00-00 00:00:00` when unknown. */
function parseGiphyDate(value: string): Date | null {
  if (!value || value.startsWith(UNKNOWN_DATETIME_PREFIX)) {
    return null;
  }

  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSize(rendition: IGiphyRendition | undefined): { width: number; height: number } | null {
  const width = toPositiveNumber(rendition?.width);
  const height = toPositiveNumber(rendition?.height);

  return width && height ? { width, height } : null;
}

function toPositiveNumber(value: string | undefined): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}
