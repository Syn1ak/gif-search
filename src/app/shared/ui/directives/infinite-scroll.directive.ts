import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, skip } from 'rxjs';

/**
 * Put on a sentinel element after a list: emits `scrolledToEnd` when the sentinel gets close to
 * the viewport. Disable it while a page is loading or when there is nothing more to load.
 */
@Directive({ selector: '[appInfiniteScroll]' })
export class InfiniteScrollDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly $disabled = input(false, { alias: 'infiniteScrollDisabled' });
  /** How early to fire; the default starts loading 800px before the sentinel is visible. */
  readonly $rootMargin = input('0px 0px 800px 0px', { alias: 'infiniteScrollRootMargin' });
  readonly $scrolledToEnd = output<void>({ alias: 'scrolledToEnd' });

  private observer: IntersectionObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.observer = new IntersectionObserver((entries) => this.onIntersection(entries), {
        rootMargin: this.$rootMargin(),
      });
      this.observer.observe(this.element.nativeElement);
    });

    // An observer only reports changes. If the sentinel is still in view when loading finishes
    // (a short page, a tall screen), observing it again reports the current state once more.
    toObservable(this.$disabled)
      .pipe(
        skip(1),
        filter((disabled) => !disabled),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.observeAgain());

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  private onIntersection(entries: IntersectionObserverEntry[]): void {
    if (!this.$disabled() && entries.some((entry) => entry.isIntersecting)) {
      this.$scrolledToEnd.emit();
    }
  }

  private observeAgain(): void {
    const element = this.element.nativeElement;
    this.observer?.unobserve(element);
    this.observer?.observe(element);
  }
}
