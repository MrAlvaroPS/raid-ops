import { Route, Routes } from '@angular/router';
import { FeatureDefinition } from './features/migration-control/domain/feature-definition';
import { PRODUCT_FEATURES } from './features/migration-control/domain/feature-catalog';
import { AppShell } from './shell/app-shell/app-shell';

function productRoute(feature: FeatureDefinition): Route {
  const route: Route = { path: feature.route, title: `${feature.label} · AvoiD Raid Ops`, data: { feature } };
  switch (feature.id) {
    case 'composition':
      return { ...route, loadComponent: () => import('./features/composition/presentation/composition-page/composition.page').then(module => module.CompositionPage) };
    case 'damage-healing':
      return { ...route, loadComponent: () => import('./features/damage-healing/presentation/damage-healing-page/damage-healing.page').then(module => module.DamageHealingPage) };
    case 'pull-lab':
      return { ...route, loadComponent: () => import('./features/pull-lab/presentation/pull-lab-page/pull-lab.page').then(module => module.PullLabPage) };
    default:
      return { ...route, loadComponent: () => import('./features/migration-control/presentation/legacy-boundary-page/legacy-boundary.page').then(module => module.LegacyBoundaryPage) };
  }
}

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
      ...PRODUCT_FEATURES.map(productRoute),
    ],
  },
  { path: '**', redirectTo: 'foundation' },
];
