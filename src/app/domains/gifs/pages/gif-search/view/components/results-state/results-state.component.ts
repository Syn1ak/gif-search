import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ERROR_MESSAGES } from '../../../constants/error-messages.constants';
import { TResultsState } from '../../../models/gif-search.types';

/** Shown in place of the grid: an empty search result or a failed request. */
@Component({
  selector: 'app-results-state',
  imports: [MatIcon, MatButton],
  template: `
    @let view = $view();
    <div
      [attr.role]="view.isError ? 'alert' : null"
      class="flex flex-col items-center gap-2 rounded-card bg-surface-container-low px-6 py-14 text-center"
    >
      <mat-icon aria-hidden="true" [class]="view.isError ? 'text-error' : 'text-on-surface-variant'">
        {{ view.icon }}
      </mat-icon>
      <p class="text-lg font-semibold">{{ view.title }}</p>
      <p class="max-w-md text-on-surface-variant">{{ view.hint }}</p>
      @if (view.retryable) {
        <button matButton="tonal" type="button" class="mt-3" (click)="$retry.emit()">
          <mat-icon>refresh</mat-icon>
          Try again
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsStateComponent {
  readonly $state = input.required<TResultsState>({ alias: 'state' });
  readonly $retry = output<void>({ alias: 'retry' });

  protected readonly $view = computed(() => {
    const state = this.$state();

    if (state.kind === 'empty') {
      return {
        isError: false,
        icon: 'search_off',
        title: `Nothing found for “${state.query}”`,
        hint: 'Try a different or more general keyword.',
        retryable: false,
      };
    }

    return {
      isError: true,
      ...ERROR_MESSAGES[state.error],
    };
  });
}
