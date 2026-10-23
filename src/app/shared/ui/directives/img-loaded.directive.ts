import { Directive, signal } from '@angular/core';

export type TImgLoadState = 'loading' | 'loaded' | 'error';

/**
 * Tracks an image's loading: it stays transparent (`opacity-0`) until it has loaded. The host template
 * adds the opacity transition, so it can combine it with its own. The state is exported
 * (`#img="appImgLoaded"`) so the host can show a skeleton meanwhile, or a placeholder on error.
 */
@Directive({
  selector: 'img[appImgLoaded]',
  exportAs: 'appImgLoaded',
  host: {
    '[class.opacity-0]': '$state() !== "loaded"',
    '(load)': '$loadState.set("loaded")',
    '(error)': '$loadState.set("error")',
  },
})
export class ImgLoadedDirective {
  protected readonly $loadState = signal<TImgLoadState>('loading');

  readonly $state = this.$loadState.asReadonly();
}
