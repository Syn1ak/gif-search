import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ImgLoadedDirective } from '../../../../../shared/ui/directives/img-loaded.directive';
import { TGif } from '../../../models/gif.types';

@Component({
  selector: 'app-gif-card',
  imports: [MatIcon, MatTooltip, ImgLoadedDirective],
  templateUrl: './gif-card.component.html',
  host: {
    '(mouseenter)': '$hovered.set(true)',
    '(mouseleave)': '$hovered.set(false)',
    '(focusin)': '$focused.set(true)',
    '(focusout)': '$focused.set(false)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifCardComponent {
  readonly $gif = input.required<TGif>({ alias: 'gif' });
  readonly $open = output<TGif>({ alias: 'open' });
  /** Quick copy of the GIF's media link, without opening the details. */
  readonly $copyLink = output<TGif>({ alias: 'copyLink' });

  protected readonly $hovered = signal(false);
  protected readonly $focused = signal(false);

  readonly $aspectRatio = computed(() => {
    const { width, height } = this.$gif().preview;
    return `${width} / ${height}`;
  });

  /** Hovered or focused: with reduced motion, only then does the GIF animate. */
  protected readonly $isActive = computed(() => {
    const hovered = this.$hovered();
    const focused = this.$focused();

    return hovered || focused;
  });
}
