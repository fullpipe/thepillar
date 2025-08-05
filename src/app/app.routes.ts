import { Routes } from '@angular/router';
import { Index } from './page/index';
import { Color } from './page/color/color';
import { Thepillar } from './page/thepillar/thepillar';
import { Thepillar3d } from './page/thepillar3d/thepillar3d';

export const routes: Routes = [
  {
    path: '',
    // component: Thepillar3d,
    loadComponent: () =>
      import('./page/thepillar3d/thepillar3d').then((m) => m.Thepillar3d),

    title: 'The Pillar Radio by Pterodactyl Supplies',
  },
  {
    path: 'color',
    component: Color,
    title: 'Alexandra Fiodorova likes blue',
  },
  {
    path: 'index',
    component: Index,
    title: 'Alexandra Fiodorova',
  },
  {
    path: 'thepillar',
    component: Thepillar,
    title: 'The Pillar Radio by Pterodactyl Supplies',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
