import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, Subject, switchMap } from 'rxjs';
import { GiphyApiError } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import { TGif } from '../../../../models/gif.types';
import { toGif } from '../../../../utils/gif.mapper';
import { TGifSearchState } from '../../models/gif-search.types';

type TPageRequest = { query: string; offset: number };

const INITIAL_STATE: TGifSearchState = {
  query: '',
  mode: 'trending',
  items: [],
  offset: 0,
  total: 0,
  status: 'idle',
  error: null,
};

/** Page state for GIF search: an empty query shows trending, anything else searches. */
@Injectable()
export class GifSearchFacade {
  private readonly gifsClient = inject(GifsClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly $state = signal<TGifSearchState>(INITIAL_STATE);

  readonly $query = computed(() => this.$state().query);
  readonly $mode = computed(() => this.$state().mode);
  readonly $items = computed(() => this.$state().items);
  readonly $status = computed(() => this.$state().status);
  readonly $error = computed(() => this.$state().error);

  private readonly request$ = new Subject<TPageRequest>();

  constructor() {
    this.request$
      .pipe(
        switchMap((request) => this.fetchPage$(request)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((patch) =>
        this.$state.update((state) => ({
          ...state,
          ...patch,
        })),
      );
  }

  search(query: string): void {
    const q = query.trim();

    this.$state.set({
      ...INITIAL_STATE,
      query: q,
      mode: q ? 'search' : 'trending',
      status: 'loading',
    });
    this.request$.next({
      query: q,
      offset: 0,
    });
  }

  private fetchPage$({ query, offset }: TPageRequest): Observable<Partial<TGifSearchState>> {
    const page$ = query
      ? this.gifsClient.search$({
          q: query,
          offset,
        })
      : this.gifsClient.trending$({ offset });

    return page$.pipe(
      map(({ data, pagination }): Partial<TGifSearchState> => {
        const nextOffset = pagination.offset + pagination.count;

        return {
          status: 'loaded',
          items: data.map((dto) => toGif(dto)).filter((gif): gif is TGif => gif !== null),
          offset: nextOffset,
          total: pagination.total_count ?? nextOffset,
        };
      }),
      catchError((error: unknown) =>
        of<Partial<TGifSearchState>>({
          status: 'error',
          error: error instanceof GiphyApiError ? error.kind : 'unknown',
        }),
      ),
    );
  }
}
