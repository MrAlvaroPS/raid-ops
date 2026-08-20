import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { PullLabRepository } from '../application/pull-lab.repository';
import { PullLabScope, PullLabSnapshot } from '../domain/pull-lab.models';
import { decodePullLabResponse } from './pull-lab-api.contract';

export const PULL_LAB_REPOSITORY = new InjectionToken<PullLabRepository>('PULL_LAB_REPOSITORY');

@Injectable()
export class PullLabApiRepository implements PullLabRepository {
  constructor(private readonly api: LegacyApiClient) {}

  load(scope: PullLabScope): Promise<PullLabSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    return firstValueFrom(
      this.api.get(`/api/wcl/operational-execution?${query}` as `/api/${string}`, (value) =>
        decodePullLabResponse(value, scope),
      ),
    );
  }
}

export const PULL_LAB_PROVIDERS = [
  PullLabApiRepository,
  { provide: PULL_LAB_REPOSITORY, useExisting: PullLabApiRepository },
];
