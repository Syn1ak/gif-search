import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'GIF Search',
    loadComponent: () => import('./view/gif-search.component'),
  },
];
