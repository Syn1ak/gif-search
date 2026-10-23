import { Routes } from '@angular/router';
import { GifDetailsModalFacade } from '../../features/gif-details-modal/data-access/facades/gif-details-modal.facade';
import { GifSearchFacade } from './data-access/facades/gif-search.facade';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'GIF Search',
    providers: [GifSearchFacade, GifDetailsModalFacade],
    loadComponent: () => import('./view/gif-search.component'),
  },
];
