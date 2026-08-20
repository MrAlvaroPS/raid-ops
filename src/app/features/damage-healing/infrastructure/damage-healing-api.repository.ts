import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiContractError } from '../../../core/http/api-contract';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { DamageHealingRepository } from '../application/damage-healing.repository';
import { DamageHealingScope, DamageHealingSnapshot } from '../domain/damage-healing.models';
import {
  composeDamageHealingSnapshot,
  decodeDamageHealingReport,
  decodeDamageHealingTelemetry,
} from './damage-healing-api.contract';

export const DAMAGE_HEALING_REPOSITORY = new InjectionToken<DamageHealingRepository>('DAMAGE_HEALING_REPOSITORY');

@Injectable()
export class DamageHealingApiRepository implements DamageHealingRepository {
  constructor(private readonly api: LegacyApiClient) {}

  async load(scope: DamageHealingScope): Promise<DamageHealingSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    const [reportResult, telemetryResult] = await Promise.allSettled([
      firstValueFrom(this.api.get(`/api/wcl/report?${query}` as `/api/${string}`, value => decodeDamageHealingReport(value, scope))),
      firstValueFrom(this.api.get(`/api/wcl/telemetry?${query}` as `/api/${string}`, value => decodeDamageHealingTelemetry(value, scope))),
    ]);
    const contractFailure = [reportResult, telemetryResult]
      .find((result): result is PromiseRejectedResult => result.status === 'rejected' && result.reason instanceof ApiContractError);
    if (contractFailure) throw contractFailure.reason;
    if (reportResult.status === 'rejected' && telemetryResult.status === 'rejected') throw reportResult.reason;
    return composeDamageHealingSnapshot(
      scope,
      reportResult.status === 'fulfilled' ? reportResult.value : null,
      telemetryResult.status === 'fulfilled' ? telemetryResult.value : null,
      [
        ...(reportResult.status === 'rejected' ? ['report' as const] : []),
        ...(telemetryResult.status === 'rejected' ? ['telemetry' as const] : []),
      ],
    );
  }
}

export const DAMAGE_HEALING_PROVIDERS = [
  DamageHealingApiRepository,
  { provide: DAMAGE_HEALING_REPOSITORY, useExisting: DamageHealingApiRepository },
];
