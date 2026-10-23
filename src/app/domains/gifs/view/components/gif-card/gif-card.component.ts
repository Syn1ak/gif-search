import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TGif } from '../../../models/gif.types';

@Component({
  selector: 'app-gif-card',
  templateUrl: './gif-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifCardComponent {
  readonly $gif = input.required<TGif>({ alias: 'gif' });
  readonly $open = output<TGif>({ alias: 'open' });

  readonly $aspectRatio = computed(() => {
    const { width, height } = this.$gif().preview;
    return `${width} / ${height}`;
  });
}
