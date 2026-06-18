import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./page/thepillar3d/thepillar3d').then((m) => m.Thepillar3d),

    title: 'The Pillar Radio by Pterodactyl Supplies',
  },
  // {
  //   path: 'test',
  //   component: Test,
  //   title: 'Alexandra Fiodorova likes blue',
  // },
  // {
  //   path: 'color',
  //   component: Color,
  //   title: 'Alexandra Fiodorova likes blue',
  // },
  // {
  //   path: 'index',
  //   component: Index,
  //   title: 'Alexandra Fiodorova',
  // },
  // {
  //   path: 'thepillar',
  //   component: Thepillar,
  //   title: 'The Pillar Radio by Pterodactyl Supplies',
  // },
  {
    path: '**',
    redirectTo: '',
  },
];
