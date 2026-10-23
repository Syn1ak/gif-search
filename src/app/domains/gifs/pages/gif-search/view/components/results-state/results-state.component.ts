import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Message shown in place of the grid when a search has no results. */
@Component({
  selector: 'app-results-state',
  imports: [MatIcon],
  template: `
    <div
      class="flex flex-col items-center gap-2 rounded-card bg-surface-container-low px-6 py-14 text-center"
    >
      <mat-icon aria-hidden="true" class="text-on-surface-variant">search_off</mat-icon>
      <p class="text-lg font-semibold">Nothing found for “{{ $query() }}”</p>
      <p class="text-on-surface-variant">Try a different or more general keyword.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsStateComponent {
  readonly $query = input.required<string>({ alias: 'query' });
}
