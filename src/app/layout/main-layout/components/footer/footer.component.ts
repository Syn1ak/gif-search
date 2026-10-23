import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="border-t border-outline-variant/60">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-on-surface-variant sm:flex-row sm:px-6"
      >
        <p>Search, copy and download GIFs in seconds.</p>
        <a
          href="https://giphy.com"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded font-semibold text-on-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Powered by GIPHY
        </a>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
