import { Routes } from '@angular/router';
import { Index } from './page/index';
import { Color } from './page/color/color';
import { Thepillar } from './page/thepillar/thepillar';

export const routes: Routes = [
  {
    path: '',
    component: Index,
  },
  {
    path: 'color',
    component: Color,
  },
  {
    path: 'thepillar',
    component: Thepillar,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
