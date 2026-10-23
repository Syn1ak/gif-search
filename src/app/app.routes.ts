import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./domains/gifs/pages/gif-search/gif-search.routes').then((r) => r.ROUTES),
  },
  { path: '**', redirectTo: '' },
];
