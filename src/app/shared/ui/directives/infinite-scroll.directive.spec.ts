import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.add(element);
  }

  unobserve(element: Element): void {
    this.observed.delete(element);
  }

  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }

  /** Simulates the sentinel entering or leaving the viewport. */
  intersect(isIntersecting: boolean): void {
    const entries = [...this.observed].map(
      (target) =>
        ({
          target,
          isIntersecting,
        }) as IntersectionObserverEntry,
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

@Component({
  imports: [InfiniteScrollDirective],
  template: `<div
    appInfiniteScroll
    [infiniteScrollDisabled]="disabled()"
    (scrolledToEnd)="reached = reached + 1"
  ></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly disabled = signal(false);
  reached = 0;
}

describe('InfiniteScrollDirective', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const observer = FakeIntersectionObserver.instances[0]!;
    return {
      fixture,
      host: fixture.componentInstance,
      observer,
    };
  }

  it('observes the sentinel with a margin so the next page loads before the end is visible', async () => {
    const { fixture, observer } = await render();

    expect(observer.observed.has((fixture.nativeElement as HTMLElement).firstElementChild!)).toBe(true);
    expect(observer.options?.rootMargin).toBe('0px 0px 800px 0px');
  });

  it('emits when the sentinel comes into view', async () => {
    const { host, observer } = await render();

    observer.intersect(false);
    expect(host.reached).toBe(0);

    observer.intersect(true);
    expect(host.reached).toBe(1);
  });

  it('stays silent while disabled', async () => {
    const { fixture, host, observer } = await render();

    host.disabled.set(true);
    await fixture.whenStable();
    observer.intersect(true);

    expect(host.reached).toBe(0);
  });

  it('observes again when re-enabled, so a sentinel that never left the viewport fires again', async () => {
    const { fixture, host, observer } = await render();
    const unobserve = vi.spyOn(observer, 'unobserve');
    const observe = vi.spyOn(observer, 'observe');

    host.disabled.set(true);
    await fixture.whenStable();
    host.disabled.set(false);
    await fixture.whenStable();

    expect(unobserve).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(1);
  });

  it('disconnects when destroyed', async () => {
    const { fixture, observer } = await render();

    fixture.destroy();

    expect(observer.disconnected).toBe(true);
  });
});
