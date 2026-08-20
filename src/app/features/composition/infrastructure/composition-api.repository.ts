import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { CompositionRepository } from '../application/composition.repository';
import { CompositionScope, CompositionSnapshot } from '../domain/composition.models';
import { decodeCompositionTelemetry } from './composition-api.contract';

export const COMPOSITION_REPOSITORY = new InjectionToken<CompositionRepository>('COMPOSITION_REPOSITORY');

@Injectable()
export class CompositionApiRepository implements CompositionRepository {
  constructor(private readonly api: LegacyApiClient) {}

  load(scope: CompositionScope): Promise<CompositionSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    return firstValueFrom(this.api.get(`/api/wcl/telemetry?${query}` as `/api/${string}`, decodeCompositionTelemetry));
  }
}

export const COMPOSITION_PROVIDERS = [
  CompositionApiRepository,
  { provide: COMPOSITION_REPOSITORY, useExisting: CompositionApiRepository },
];
