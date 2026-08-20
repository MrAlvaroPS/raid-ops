import { FeatureDefinition } from '../domain/feature-definition';

export interface MigrationReadiness {
  readonly totalSurfaces: number;
  readonly angularOwnedSurfaces: number;
  readonly legacyOwnedSurfaces: number;
  readonly productionSwitchAllowed: boolean;
}

export function buildMigrationReadiness(features: readonly FeatureDefinition[]): MigrationReadiness {
  const angularOwnedSurfaces = features.filter(feature => feature.owner === 'angular').length;
  return Object.freeze({
    totalSurfaces: features.length,
    angularOwnedSurfaces,
    legacyOwnedSurfaces: features.length - angularOwnedSurfaces,
    productionSwitchAllowed: features.length > 0 && angularOwnedSurfaces === features.length,
  });
}
