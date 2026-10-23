import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GifSearchFacade } from '../data-access/facades/gif-search.facade';
import { GifGridComponent } from './components/gif-grid/gif-grid.component';
import { GridSkeletonComponent } from './components/grid-skeleton/grid-skeleton.component';
import { ResultsStateComponent } from './components/results-state/results-state.component';
import { SearchFormComponent } from './components/search-form/search-form.component';

/** The URL is the source of truth: `?q` drives the facade, the search form only changes the URL. */
@Component({
  selector: 'app-gif-search',
  imports: [GifGridComponent, GridSkeletonComponent, ResultsStateComponent, SearchFormComponent],
  templateUrl: './gif-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GifSearchComponent {
  private readonly router = inject(Router);
  protected readonly facade = inject(GifSearchFacade);

  /** `?q`, bound by the router (withComponentInputBinding); undefined when absent. */
  readonly $q = input<string | undefined>(undefined, { alias: 'q' });

  protected readonly $heading = computed(() => {
    const mode = this.facade.$mode();
    const query = this.facade.$query();

    return mode === 'search' ? `Results for “${query}”` : 'Trending now';
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
