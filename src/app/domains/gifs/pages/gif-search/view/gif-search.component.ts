import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GifSearchFacade } from '../data-access/facades/gif-search.facade';
import { GifGridComponent } from './components/gif-grid/gif-grid.component';
import { GridSkeletonComponent } from './components/grid-skeleton/grid-skeleton.component';

@Component({
  selector: 'app-gif-search',
  imports: [GifGridComponent, GridSkeletonComponent],
  templateUrl: './gif-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GifSearchComponent implements OnInit {
  protected readonly facade = inject(GifSearchFacade);

  ngOnInit(): void {
    this.facade.search('');
  }
}
