import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-gif-search',
  templateUrl: './gif-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GifSearchComponent {}
