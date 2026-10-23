import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TGif } from '../../../../../models/gif.types';
import { GifCardComponent } from '../../../../../view/components/gif-card/gif-card.component';
import { distributeIntoColumns } from '../../../utils/masonry-columns';

/** Tailwind breakpoints (xl, lg, md) and the column count used from each of them up. */
const COLUMN_BREAKPOINTS: readonly (readonly [string, number])[] = [
  ['(min-width: 80rem)', 5],
  ['(min-width: 64rem)', 4],
  ['(min-width: 48rem)', 3],
];
const MOBILE_COLUMNS = 2;

@Component({
  selector: 'app-gif-grid',
  imports: [GifCardComponent],
  template: `
    <div class="flex items-start gap-3 sm:gap-4">
      @for (column of $columns(); track $index) {
        <div class="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          @for (gif of column; track gif.id) {
            <app-gif-card [gif]="gif" (open)="$open.emit($event)" />
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifGridComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly $items = input.required<TGif[]>({ alias: 'items' });
  readonly $open = output<TGif>({ alias: 'open' });

  private readonly $columnCount = toSignal(
    this.breakpointObserver
      .observe(COLUMN_BREAKPOINTS.map(([query]) => query))
      .pipe(map((state) => toColumnCount(state))),
    { initialValue: MOBILE_COLUMNS },
  );

  readonly $columns = computed(() => {
    const items = this.$items();
    const columnCount = this.$columnCount();

    return distributeIntoColumns(items, columnCount, ({ preview }) => preview.height / preview.width);
  });
}

function toColumnCount({ breakpoints }: BreakpointState): number {
  return COLUMN_BREAKPOINTS.find(([query]) => breakpoints[query])?.[1] ?? MOBILE_COLUMNS;
}
