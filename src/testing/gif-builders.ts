import { TGif } from '../app/domains/gifs/models/gif.types';

/** A complete view-model GIF; override any field per test. */
export function buildGif(overrides: Partial<TGif> = {}): TGif {
  return {
    id: 'abc',
    slug: 'happy-cat-abc',
    title: 'Happy Cat',
    altText: 'A cat smiling',
    rating: 'pg-13',
    pageUrl: 'https://giphy.com/gifs/happy-cat-abc',
    sourceUrl: 'https://www.reddit.com/r/cats/123',
    createdAt: new Date('2024-05-17T10:20:30Z'),
    author: {
      name: 'Cat Lover',
      username: 'catlover',
      avatarUrl: 'https://media.test/avatar.gif',
      profileUrl: 'https://giphy.com/catlover/',
    },
    preview: {
      url: 'https://media.test/200w.webp',
      stillUrl: 'https://media.test/200w_s.gif',
      width: 200,
      height: 113,
    },
    original: {
      url: 'https://media.test/giphy.gif',
      stillUrl: 'https://media.test/giphy_s.gif',
      width: 480,
      height: 270,
      size: 1_572_864,
    },
    ...overrides,
  };
}
