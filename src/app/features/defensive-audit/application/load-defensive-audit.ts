import { DefensiveAuditRepository } from './defensive-audit.repository';
import { DefensiveAuditScope, DefensiveAuditSnapshot } from '../domain/defensive-audit.models';

export class LoadDefensiveAudit {
  constructor(private readonly repository: DefensiveAuditRepository) {}

  execute(scope: DefensiveAuditScope): Promise<DefensiveAuditSnapshot> {
    return this.repository.load(scope);
  }
}
