import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IGiphyGif } from '../../../entities/giphy/gif.dto';
import { IGifPageCriteria, IGifSearchCriteria } from '../../../entities/giphy/gif-search.criteria';
import { IGiphyListResponse, IGiphySingleResponse } from '../../../entities/giphy/giphy-response.dto';
import { GIPHY_CONFIG } from '../../../tokens/giphy-config.token';

@Injectable({ providedIn: 'root' })
export class GifsClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(GIPHY_CONFIG);

  search$({ q, offset }: IGifSearchCriteria): Observable<IGiphyListResponse<IGiphyGif>> {
    const { pageSize, rating, lang } = this.config;

    return this.http.get<IGiphyListResponse<IGiphyGif>>(this.url('gifs/search'), {
      params: {
        q,
        offset,
        limit: pageSize,
        rating,
        lang,
      },
    });
  }

  trending$({ offset }: IGifPageCriteria): Observable<IGiphyListResponse<IGiphyGif>> {
    const { pageSize, rating } = this.config;

    return this.http.get<IGiphyListResponse<IGiphyGif>>(this.url('gifs/trending'), {
      params: {
        offset,
        limit: pageSize,
        rating,
      },
    });
  }

  getById$(id: string): Observable<IGiphySingleResponse<IGiphyGif>> {
    return this.http.get<IGiphySingleResponse<IGiphyGif>>(this.url(`gifs/${encodeURIComponent(id)}`));
  }

  private url(path: string): string {
    return `${this.config.baseUrl}/${path}`;
  }
}
