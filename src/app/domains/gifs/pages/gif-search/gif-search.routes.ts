import { Routes } from '@angular/router';
import { GifSearchFacade } from './data-access/facades/gif-search.facade';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'GIF Search',
    providers: [GifSearchFacade],
    loadComponent: () => import('./view/gif-search.component'),
  },
];
