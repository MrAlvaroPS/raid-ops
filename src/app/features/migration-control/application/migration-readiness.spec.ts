import { buildMigrationReadiness } from './migration-readiness';
import { PRODUCT_FEATURES } from '../domain/feature-catalog';

describe('migration readiness', () => {
  it('transfers only the five verified Phase 4 surfaces', () => {
    const readiness = buildMigrationReadiness(PRODUCT_FEATURES);

    expect(readiness.totalSurfaces).toBe(11);
    expect(readiness.angularOwnedSurfaces).toBe(5);
    expect(readiness.legacyOwnedSurfaces).toBe(6);
    expect(readiness.productionSwitchAllowed).toBe(false);
    expect(new Set(PRODUCT_FEATURES.map((feature) => feature.route)).size).toBe(
      PRODUCT_FEATURES.length,
    );
  });
});
