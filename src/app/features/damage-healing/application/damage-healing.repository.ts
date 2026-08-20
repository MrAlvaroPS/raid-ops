import { DamageHealingScope, DamageHealingSnapshot } from '../domain/damage-healing.models';

export abstract class DamageHealingRepository {
  abstract load(scope: DamageHealingScope): Promise<DamageHealingSnapshot>;
}
