import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, filter, map, merge, Subject } from 'rxjs';
import { InputControlComponent } from '../../../../../../../shared/ui/forms/input-control/input-control.component';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS } from '../../../constants/search.constants';

/** Emits a query to search while the user types (debounced) or on Enter. Empty means "show trending". */
@Component({
  selector: 'app-search-form',
  imports: [ReactiveFormsModule, InputControlComponent],
  template: `
    <form role="search" (submit)="$event.preventDefault()">
      <app-input-control
        [formControl]="control"
        type="search"
        placeholder="Search GIFs, e.g. happy cat"
        prefixIcon="search"
        [clearable]="true"
        [loading]="$loading()"
        (enter)="enter$.next($event)"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFormComponent {
  /** The query currently shown in the results (from the URL). */
  readonly $query = input('', { alias: 'query' });
  readonly $loading = input(false, { alias: 'loading' });
  /** Not called `search`: that name would also catch the native `search` event of the inner input. */
  readonly $querySubmit = output<string>({ alias: 'querySubmit' });

  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(MAX_QUERY_LENGTH)],
  });

  protected readonly enter$ = new Subject<string>();

  /** Last query this form knows about: received from the URL or emitted by itself. */
  private currentQuery = '';

  constructor() {
    toObservable(this.$query)
      .pipe(takeUntilDestroyed())
      .subscribe((query) => {
        this.currentQuery = query;
        if (query !== this.control.value.trim()) {
          this.control.setValue(query, { emitEvent: false });
        }
      });

    merge(this.control.valueChanges.pipe(debounceTime(SEARCH_DEBOUNCE_MS)), this.enter$)
      .pipe(
        filter(() => this.control.valid),
        map((value) => value.trim()),
        filter((query) => query.length === 0 || query.length >= MIN_QUERY_LENGTH),
        filter((query) => query !== this.currentQuery),
        takeUntilDestroyed(),
      )
      .subscribe((query) => {
        this.currentQuery = query;
        this.$querySubmit.emit(query);
      });
  }
}
