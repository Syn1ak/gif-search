import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { GIPHY_CONFIG } from './giphy-config.token';

describe('GIPHY_CONFIG', () => {
  it('defaults to the environment key and the documented Giphy limits', () => {
    const config = TestBed.inject(GIPHY_CONFIG);

    expect(config).toEqual({
      apiKey: environment.giphyApiKey,
      baseUrl: 'https://api.giphy.com/v1',
      pageSize: 30,
      rating: 'g',
      lang: 'en',
      offsetCap: {
        search: 4999,
        trending: 499,
      },
    });
  });
});
