import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TGif } from '../../../models/gif.types';

@Component({
  selector: 'app-gif-card',
  imports: [MatIcon, MatTooltip],
  templateUrl: './gif-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifCardComponent {
  readonly $gif = input.required<TGif>({ alias: 'gif' });
  readonly $open = output<TGif>({ alias: 'open' });
  /** Quick copy of the GIF's media link, without opening the details. */
  readonly $copyLink = output<TGif>({ alias: 'copyLink' });

  readonly $aspectRatio = computed(() => {
    const { width, height } = this.$gif().preview;
    return `${width} / ${height}`;
  });
}
