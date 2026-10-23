import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, Subject, switchMap } from 'rxjs';
import { GiphyApiError } from '../../../../../../core/models/giphy-error';
import { GifsClient } from '../../../../../../core/services/api/giphy/gifs.client';
import { GIPHY_CONFIG } from '../../../../../../core/tokens/giphy-config.token';
import { TGif } from '../../../../models/gif.types';
import { toGif } from '../../../../utils/gif.mapper';
import { TGifSearchState } from '../../models/gif-search.types';

type TPageRequest = { query: string; offset: number };
type TStateUpdate = (state: TGifSearchState) => TGifSearchState;

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
  private readonly config = inject(GIPHY_CONFIG);
  private readonly destroyRef = inject(DestroyRef);

  private readonly $state = signal<TGifSearchState>(INITIAL_STATE);

  readonly $query = computed(() => this.$state().query);
  readonly $mode = computed(() => this.$state().mode);
  readonly $items = computed(() => this.$state().items);
  readonly $status = computed(() => this.$state().status);
  readonly $error = computed(() => this.$state().error);

  /** False once Giphy has no more results or the endpoint's offset limit is reached. */
  readonly $hasMore = computed(() => {
    const { offset, total, mode } = this.$state();

    return offset < total && offset <= this.config.offsetCap[mode];
  });

  readonly $canLoadMore = computed(() => {
    const status = this.$status();
    const hasMore = this.$hasMore();

    return status === 'loaded' && hasMore;
  });

  private readonly request$ = new Subject<TPageRequest>();

  constructor() {
    this.request$
      .pipe(
        switchMap((request) => this.fetchPage$(request)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((update) => this.$state.update(update));
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

  loadMore(): void {
    if (!this.$canLoadMore()) {
      return;
    }

    const { query, offset } = this.$state();

    this.$state.update((state) => ({
      ...state,
      status: 'loading-more',
    }));
    this.request$.next({
      query,
      offset,
    });
  }

  private fetchPage$({ query, offset }: TPageRequest): Observable<TStateUpdate> {
    const page$ = query
      ? this.gifsClient.search$({
          q: query,
          offset,
        })
      : this.gifsClient.trending$({ offset });

    return page$.pipe(
      map(({ data, pagination }): TStateUpdate => {
        const gifs = data.map((dto) => toGif(dto)).filter((gif): gif is TGif => gif !== null);
        const nextOffset = pagination.offset + pagination.count;

        return (state) => ({
          ...state,
          status: 'loaded',
          items: offset === 0 ? gifs : appendUnique(state.items, gifs),
          offset: nextOffset,
          // An empty page means Giphy has nothing more, whatever total_count says.
          total: data.length ? (pagination.total_count ?? nextOffset) : nextOffset,
        });
      }),
      catchError((error: unknown) =>
        of<TStateUpdate>((state) => ({
          ...state,
          status: 'error',
          error: error instanceof GiphyApiError ? error.kind : 'unknown',
        })),
      ),
    );
  }
}

/** Giphy pages can overlap when results shift between requests, so ids are de-duplicated. */
function appendUnique(items: TGif[], incoming: TGif[]): TGif[] {
  const seen = new Set(items.map(({ id }) => id));
  return [...items, ...incoming.filter(({ id }) => !seen.has(id))];
}
