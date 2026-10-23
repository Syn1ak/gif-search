import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Varied heights so the placeholder reads as a masonry grid rather than a table. */
const PLACEHOLDER_HEIGHTS = [180, 260, 140, 220, 300, 160, 240, 200, 280, 150, 230, 190, 210, 170, 250];

@Component({
  selector: 'app-grid-skeleton',
  template: `
    <div role="status" class="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4 xl:columns-5">
      <span class="sr-only">Loading GIFs…</span>
      @for (height of heights; track $index) {
        <div
          aria-hidden="true"
          class="mb-3 break-inside-avoid animate-pulse rounded-card bg-surface-container-high motion-reduce:animate-none sm:mb-4"
          [style.height.px]="height"
        ></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridSkeletonComponent {
  readonly heights = PLACEHOLDER_HEIGHTS;
}
