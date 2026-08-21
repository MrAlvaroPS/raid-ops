import { DefensiveAuditScope, DefensiveAuditSnapshot } from '../domain/defensive-audit.models';

export interface DefensiveAuditRepository {
  load(scope: DefensiveAuditScope): Promise<DefensiveAuditSnapshot>;
}
