import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { InfiniteScrollDirective } from '../../../../../shared/ui/directives/infinite-scroll.directive';
import { GifDetailsModalFacade } from '../../../features/gif-details-modal/data-access/facades/gif-details-modal.facade';
import { ERROR_MESSAGES, TErrorMessage } from '../../../constants/error-messages.constants';
import { GifSearchFacade } from '../data-access/facades/gif-search.facade';
import { TGif } from '../../../models/gif.types';
import { TResultsState } from '../models/gif-search.types';
import { GifGridComponent } from './components/gif-grid/gif-grid.component';
import { GridSkeletonComponent } from './components/grid-skeleton/grid-skeleton.component';
import { ResultsStateComponent } from './components/results-state/results-state.component';
import { SearchFormComponent } from './components/search-form/search-form.component';

/**
 * The URL is the source of truth: `?q` drives the search and `?gif` the details dialog. The search form
 * and the cards only change the URL.
 */
@Component({
  selector: 'app-gif-search',
  imports: [
    GifGridComponent,
    GridSkeletonComponent,
    ResultsStateComponent,
    SearchFormComponent,
    InfiniteScrollDirective,
    MatProgressSpinner,
    MatButton,
    MatIcon,
  ],
  templateUrl: './gif-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GifSearchComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly facade = inject(GifSearchFacade);
  protected readonly detailsModal = inject(GifDetailsModalFacade);

  /** `?q`, bound by the router (withComponentInputBinding); undefined when absent. */
  readonly $q = input<string | undefined>(undefined, { alias: 'q' });
  /** `?gif`, the id of the GIF whose details are open. */
  readonly $gifId = input<string | undefined>(undefined, { alias: 'gif' });

  protected readonly $heading = computed(() => {
    const mode = this.facade.$mode();
    const query = this.facade.$query();

    return mode === 'search' ? `Results for “${query}”` : 'Trending now';
  });

  /** Replaces the grid when there is nothing to show: a failed first page or an empty search. */
  protected readonly $resultsState = computed((): TResultsState | null => {
    const status = this.facade.$status();
    const error = this.facade.$error();
    const mode = this.facade.$mode();
    const query = this.facade.$query();

    if (status === 'error') {
      return {
        kind: 'error',
        error: error ?? 'unknown',
      };
    }

    if (status === 'loaded' && mode === 'search') {
      return {
        kind: 'empty',
        query,
      };
    }

    return null;
  });

  /** A failed next page keeps the grid and shows the error under it. */
  protected readonly $loadMoreError = computed((): TErrorMessage | null => {
    const status = this.facade.$status();
    const error = this.facade.$error();
    const hasItems = this.facade.$items().length > 0;

    return status === 'error' && hasItems ? ERROR_MESSAGES[error ?? 'unknown'] : null;
  });

  /** Whether this page pushed the current `?gif` history entry, so closing the dialog can step back. */
  private pushedGifEntry = false;

  constructor() {
    toObservable(this.$q)
      .pipe(takeUntilDestroyed())
      .subscribe((q) => this.facade.search(q ?? ''));
    toObservable(this.$gifId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.showDetails(id));
    this.detailsModal.closed$.pipe(takeUntilDestroyed()).subscribe(() => this.onDetailsClosed());
  }

  onSearch(query: string): void {
    void this.router.navigate([], {
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
    });
  }

  onOpenDetails(gif: TGif): void {
    this.pushedGifEntry = true;
    void this.router.navigate([], {
      queryParams: { gif: gif.id },
      queryParamsHandling: 'merge',
    });
  }

  /** Opens the dialog for `?gif`, with the GIF from the grid when it is loaded, or closes it. */
  private showDetails(id: string | undefined): void {
    if (!id) {
      this.pushedGifEntry = false;
      this.detailsModal.close();
      return;
    }

    const loadedGif = this.facade.$items().find((gif) => gif.id === id) ?? null;
    this.detailsModal.open(id, loadedGif);
  }

  /**
   * Removes `?gif` once the user closes the dialog: steps back over the entry this page pushed, so the
   * history has no leftover entry, or replaces a deep-linked one. Nothing to do when the URL closed it.
   */
  private onDetailsClosed(): void {
    if (!this.$gifId()) {
      return;
    }

    if (this.pushedGifEntry) {
      this.location.back();
      return;
    }

    void this.router.navigate([], {
      queryParams: { gif: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
