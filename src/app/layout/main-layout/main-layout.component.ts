import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="flex min-h-dvh flex-col">
      <!-- Visible only when focused: lets keyboard users jump past the header. -->
      <a
        href="#main-content"
        class="sr-only z-20 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        (click)="skipToMain($event)"
      >
        Skip to main content
      </a>
      <app-header />
      <!-- At least a screen tall (minus the 4rem header): the footer starts below the fold, so it does not
           jump down (a layout shift) when the lazy page renders after a slow load. -->
      <main
        #main
        id="main-content"
        tabindex="-1"
        class="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6"
      >
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly $main = viewChild.required<ElementRef<HTMLElement>>('main');

  /** Focuses <main> directly: with `<base href="/">` the `#main-content` link would leave the page. */
  skipToMain(event: Event): void {
    event.preventDefault();
    this.$main().nativeElement.focus();
  }
}
