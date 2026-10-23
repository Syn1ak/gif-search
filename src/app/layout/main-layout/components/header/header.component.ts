import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-10 border-b border-outline-variant/60 bg-surface/80 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a
          routerLink="/"
          class="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            class="grid size-9 place-items-center rounded-xl bg-linear-to-br from-primary to-tertiary text-xs font-bold tracking-wide text-on-primary"
          >
            GIF
          </span>
          <span class="text-lg font-semibold tracking-tight">GIF Search</span>
        </a>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
