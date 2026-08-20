import { DamageHealingScope, DamageHealingSnapshot } from '../domain/damage-healing.models';
import { DamageHealingRepository } from './damage-healing.repository';

export class LoadDamageHealing {
  constructor(private readonly repository: DamageHealingRepository) {}

  execute(scope: DamageHealingScope): Promise<DamageHealingSnapshot> {
    return this.repository.load(scope);
  }
}
