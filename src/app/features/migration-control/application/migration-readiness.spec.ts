import { buildMigrationReadiness } from './migration-readiness';
import { PRODUCT_FEATURES } from '../domain/feature-catalog';

describe('migration readiness', () => {
  it('keeps every product surface on the legacy owner during foundation work', () => {
    const readiness = buildMigrationReadiness(PRODUCT_FEATURES);

    expect(readiness.totalSurfaces).toBe(11);
    expect(readiness.angularOwnedSurfaces).toBe(0);
    expect(readiness.legacyOwnedSurfaces).toBe(11);
    expect(readiness.productionSwitchAllowed).toBe(false);
    expect(new Set(PRODUCT_FEATURES.map(feature => feature.route)).size).toBe(PRODUCT_FEATURES.length);
  });
});
