import { Routes } from '@angular/router';
import { PRODUCT_FEATURES } from './features/migration-control/domain/feature-catalog';
import { AppShell } from './shell/app-shell/app-shell';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'foundation' },
      {
        path: 'foundation',
        title: 'Angular Foundation · AvoiD Raid Ops',
        loadComponent: () => import('./features/migration-control/presentation/foundation-page/foundation.page').then(module => module.FoundationPage),
      },
      ...PRODUCT_FEATURES.map(feature => ({
        path: feature.route,
        title: `${feature.label} · AvoiD Raid Ops`,
        data: { feature },
        loadComponent: () => import('./features/migration-control/presentation/legacy-boundary-page/legacy-boundary.page').then(module => module.LegacyBoundaryPage),
      })),
    ],
  },
  { path: '**', redirectTo: 'foundation' },
];
