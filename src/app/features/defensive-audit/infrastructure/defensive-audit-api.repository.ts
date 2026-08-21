import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { DefensiveAuditRepository } from '../application/defensive-audit.repository';
import { DefensiveAuditScope, DefensiveAuditSnapshot } from '../domain/defensive-audit.models';
import { decodeDefensiveAuditResponse } from './defensive-audit-api.contract';

export const DEFENSIVE_AUDIT_REPOSITORY = new InjectionToken<DefensiveAuditRepository>(
  'DEFENSIVE_AUDIT_REPOSITORY',
);

@Injectable()
export class DefensiveAuditApiRepository implements DefensiveAuditRepository {
  constructor(private readonly api: LegacyApiClient) {}

  load(scope: DefensiveAuditScope): Promise<DefensiveAuditSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    return firstValueFrom(
      this.api.get(`/api/wcl/operational-execution?${query}` as `/api/${string}`, (value) =>
        decodeDefensiveAuditResponse(value, scope),
      ),
    );
  }
}

export const DEFENSIVE_AUDIT_PROVIDERS = [
  DefensiveAuditApiRepository,
  { provide: DEFENSIVE_AUDIT_REPOSITORY, useExisting: DefensiveAuditApiRepository },
];
