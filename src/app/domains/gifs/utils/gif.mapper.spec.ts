import { IGiphyGif, IGiphyImages } from '../../../core/entities/giphy/gif.dto';
import { toGif } from './gif.mapper';

const MEDIA = 'https://media.giphy.test/media/abc';

function buildDto(overrides: Partial<IGiphyGif> = {}): IGiphyGif {
  return {
    type: 'gif',
    id: 'abc',
    slug: 'happy-cat-abc',
    url: 'https://giphy.com/gifs/happy-cat-abc',
    embed_url: 'https://giphy.com/embed/abc',
    username: 'catlover',
    title: 'Happy Cat GIF by catlover',
    alt_text: 'A cat smiling',
    rating: 'g',
    source: 'https://example.test',
    source_tld: 'example.test',
    source_post_url: 'https://example.test/post/1',
    import_datetime: '2024-05-17 10:20:30',
    trending_datetime: '0000-00-00 00:00:00',
    user: {
      username: 'catlover',
      display_name: 'Cat Lover',
      avatar_url: 'https://media.giphy.test/avatars/catlover.gif',
      profile_url: 'https://giphy.com/catlover/',
    },
    images: {
      original: {
        url: `${MEDIA}/giphy.gif`,
        webp: `${MEDIA}/giphy.webp`,
        width: '480',
        height: '270',
        size: '2048000',
      },
      original_still: {
        url: `${MEDIA}/giphy_s.gif`,
        width: '480',
        height: '270',
      },
      fixed_width: {
        url: `${MEDIA}/200w.gif`,
        webp: `${MEDIA}/200w.webp`,
        width: '200',
        height: '113',
      },
      fixed_width_still: {
        url: `${MEDIA}/200w_s.gif`,
        width: '200',
        height: '113',
      },
      fixed_height: {
        url: `${MEDIA}/200.gif`,
        webp: `${MEDIA}/200.webp`,
        width: '356',
        height: '200',
      },
    },
    ...overrides,
  };
}

describe('toGif', () => {
  it('maps a complete Giphy GIF to the view model', () => {
    expect(toGif(buildDto())).toEqual({
      id: 'abc',
      slug: 'happy-cat-abc',
      title: 'Happy Cat GIF by catlover',
      altText: 'A cat smiling',
      rating: 'g',
      pageUrl: 'https://giphy.com/gifs/happy-cat-abc',
      sourceUrl: 'https://example.test/post/1',
      createdAt: new Date('2024-05-17T10:20:30Z'),
      author: {
        name: 'Cat Lover',
        username: 'catlover',
        avatarUrl: 'https://media.giphy.test/avatars/catlover.gif',
        profileUrl: 'https://giphy.com/catlover/',
      },
      preview: {
        url: `${MEDIA}/200w.webp`,
        stillUrl: `${MEDIA}/200w_s.gif`,
        width: 200,
        height: 113,
      },
      original: {
        url: `${MEDIA}/giphy.gif`,
        stillUrl: `${MEDIA}/giphy_s.gif`,
        width: 480,
        height: 270,
        size: 2048000,
      },
    });
  });

  describe('author', () => {
    it('falls back to the username when there is no user profile', () => {
      const gif = toGif(
        buildDto({
          user: undefined,
          username: 'catlover',
        }),
      );

      expect(gif?.author).toEqual({
        name: 'catlover',
        username: 'catlover',
        avatarUrl: null,
        profileUrl: null,
      });
    });

    it('uses the username when the display name is empty', () => {
      const dto = buildDto();
      const gif = toGif(
        buildDto({
          user: {
            ...dto.user!,
            display_name: '',
            avatar_url: '',
          },
        }),
      );

      expect(gif?.author).toMatchObject({
        name: 'catlover',
        avatarUrl: null,
      });
    });

    it('is null for anonymous uploads', () => {
      expect(
        toGif(
          buildDto({
            user: undefined,
            username: '',
          }),
        )?.author,
      ).toBeNull();
    });
  });

  describe('createdAt', () => {
    it.each(['0000-00-00 00:00:00', '', 'not a date'])('is null for "%s"', (importDatetime) => {
      expect(toGif(buildDto({ import_datetime: importDatetime }))?.createdAt).toBeNull();
    });
  });

  describe('texts', () => {
    it('uses the title as alt text when Giphy has none', () => {
      expect(toGif(buildDto({ alt_text: '' }))?.altText).toBe('Happy Cat GIF by catlover');
    });

    it('falls back to "GIF" when both title and alt text are blank', () => {
      const gif = toGif(
        buildDto({
          title: '  ',
          alt_text: undefined,
        }),
      );

      expect(gif).toMatchObject({
        title: 'GIF',
        altText: 'GIF',
      });
    });

    it('uses the source domain page when there is no source post, and null when neither exists', () => {
      expect(toGif(buildDto({ source_post_url: '' }))?.sourceUrl).toBe('https://example.test');
      expect(
        toGif(
          buildDto({
            source_post_url: '',
            source: '',
          }),
        )?.sourceUrl,
      ).toBeNull();
    });
  });

  describe('renditions', () => {
    it('falls back to the animated gif when the preview has no webp or still', () => {
      const images: IGiphyImages = {
        original: {
          url: `${MEDIA}/giphy.gif`,
          width: '480',
          height: '270',
        },
        fixed_width: {
          url: `${MEDIA}/200w.gif`,
          width: '200',
          height: '113',
        },
      };

      expect(toGif(buildDto({ images }))?.preview).toEqual({
        url: `${MEDIA}/200w.gif`,
        stillUrl: `${MEDIA}/200w.gif`,
        width: 200,
        height: 113,
      });
    });

    it('uses fixed_height when fixed_width is missing', () => {
      const images: IGiphyImages = {
        ...buildDto().images,
        fixed_width: undefined,
        fixed_width_still: undefined,
      };

      expect(toGif(buildDto({ images }))?.preview).toMatchObject({
        url: `${MEDIA}/200.webp`,
        width: 356,
      });
    });

    it('uses the original as preview when no small rendition exists', () => {
      const images: IGiphyImages = {
        original: {
          url: `${MEDIA}/giphy.gif`,
          width: '480',
          height: '270',
        },
      };

      expect(toGif(buildDto({ images }))?.preview).toMatchObject({
        url: `${MEDIA}/giphy.gif`,
        width: 480,
      });
    });

    it('reports unknown size and still as null', () => {
      const images: IGiphyImages = {
        original: {
          url: `${MEDIA}/giphy.gif`,
          width: '480',
          height: '270',
        },
      };

      expect(toGif(buildDto({ images }))?.original).toMatchObject({
        size: null,
        stillUrl: null,
      });
    });

    it('returns null when the original rendition is unusable', () => {
      expect(toGif(buildDto({ images: {} }))).toBeNull();
      expect(
        toGif(
          buildDto({
            images: {
              original: {
                width: '480',
                height: '270',
              },
            },
          }),
        ),
      ).toBeNull();
      expect(
        toGif(
          buildDto({
            images: {
              original: {
                url: `${MEDIA}/giphy.gif`,
                width: '0',
                height: '',
              },
            },
          }),
        ),
      ).toBeNull();
    });
  });
});
