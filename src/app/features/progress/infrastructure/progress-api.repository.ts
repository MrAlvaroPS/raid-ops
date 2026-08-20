import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { ProgressRepository } from '../application/progress.repository';
import { ProgressHistoryIndex, ProgressScope, ProgressSnapshot } from '../domain/progress.models';
import { decodeProgressHistoryIndex, decodeProgressSnapshot } from './progress-api.contract';

export const PROGRESS_REPOSITORY = new InjectionToken<ProgressRepository>('PROGRESS_REPOSITORY');

@Injectable()
export class ProgressApiRepository implements ProgressRepository {
  constructor(private readonly api: LegacyApiClient) {}

  loadIndex(): Promise<ProgressHistoryIndex> {
    return firstValueFrom(this.api.get('/api/wcl/home-history', decodeProgressHistoryIndex));
  }

  loadScope(scope: ProgressScope): Promise<ProgressSnapshot> {
    const query = new URLSearchParams({
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    return firstValueFrom(
      this.api.get(`/api/wcl/home-history?${query}` as `/api/${string}`, (value) =>
        decodeProgressSnapshot(value, scope),
      ),
    );
  }
}

export const PROGRESS_PROVIDERS = [
  ProgressApiRepository,
  { provide: PROGRESS_REPOSITORY, useExisting: ProgressApiRepository },
];
