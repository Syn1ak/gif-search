import { IGiphyGif } from '../app/core/entities/giphy/gif.dto';
import { IGiphyListResponse } from '../app/core/entities/giphy/giphy-response.dto';

/** Minimal Giphy DTO that survives the mapper; pass `usable: false` for one without renditions. */
export function buildGifDto(id: string, usable = true): IGiphyGif {
  return {
    id,
    slug: `slug-${id}`,
    title: `GIF ${id}`,
    url: `https://giphy.com/gifs/${id}`,
    images: usable
      ? {
          original: {
            url: `https://media.test/${id}.gif`,
            width: '480',
            height: '270',
          },
          fixed_width: {
            url: `https://media.test/${id}-200.gif`,
            width: '200',
            height: '113',
          },
        }
      : {},
  } as IGiphyGif;
}

export function buildListResponse(data: IGiphyGif[], total = 100, offset = 0): IGiphyListResponse<IGiphyGif> {
  return {
    data,
    pagination: {
      offset,
      count: data.length,
      total_count: total,
    },
    meta: {
      status: 200,
      msg: 'OK',
      response_id: 'r',
    },
  };
}
