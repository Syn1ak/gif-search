import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { InfiniteScrollDirective } from '../../../../../shared/ui/directives/infinite-scroll.directive';
import { GifDetailsModalFacade } from '../../../features/gif-details-modal/data-access/facades/gif-details-modal.facade';
import { ERROR_MESSAGES, TErrorMessage } from '../constants/error-messages.constants';
import { GifSearchFacade } from '../data-access/facades/gif-search.facade';
import { TResultsState } from '../models/gif-search.types';
import { GifGridComponent } from './components/gif-grid/gif-grid.component';
import { GridSkeletonComponent } from './components/grid-skeleton/grid-skeleton.component';
import { ResultsStateComponent } from './components/results-state/results-state.component';
import { SearchFormComponent } from './components/search-form/search-form.component';

/** The URL is the source of truth: `?q` drives the facade, the search form only changes the URL. */
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
  protected readonly facade = inject(GifSearchFacade);
  protected readonly detailsModal = inject(GifDetailsModalFacade);

  /** `?q`, bound by the router (withComponentInputBinding); undefined when absent. */
  readonly $q = input<string | undefined>(undefined, { alias: 'q' });

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

  constructor() {
    toObservable(this.$q)
      .pipe(takeUntilDestroyed())
      .subscribe((q) => this.facade.search(q ?? ''));
  }

  onSearch(query: string): void {
    void this.router.navigate([], {
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
    });
  }
}
