import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { CommandCenterRepository } from '../application/command-center.repository';
import { CommandCenterScope, CommandCenterSnapshot } from '../domain/command-center.models';
import { decodeCommandCenterResponse } from './command-center-api.contract';

export const COMMAND_CENTER_REPOSITORY = new InjectionToken<CommandCenterRepository>(
  'COMMAND_CENTER_REPOSITORY',
);

@Injectable()
export class CommandCenterApiRepository implements CommandCenterRepository {
  constructor(private readonly api: LegacyApiClient) {}

  load(scope: CommandCenterScope): Promise<CommandCenterSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    return firstValueFrom(
      this.api.get(`/api/wcl/operational-execution?${query}` as `/api/${string}`, (value) =>
        decodeCommandCenterResponse(value, scope),
      ),
    );
  }
}

export const COMMAND_CENTER_PROVIDERS = [
  CommandCenterApiRepository,
  { provide: COMMAND_CENTER_REPOSITORY, useExisting: CommandCenterApiRepository },
];
