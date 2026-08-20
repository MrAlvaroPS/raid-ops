import { Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiContractError } from '../../../core/http/api-contract';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { PlayersRepository } from '../application/players.repository';
import { PlayersPlayer, PlayersScope, PlayersSnapshot } from '../domain/players.models';
import { joinAttendance } from '../domain/players.rules';
import {
  decodePlayersHistory,
  decodePlayersIntelligence,
  decodePlayersTelemetry,
  PlayerMatrixDto,
  PlayersHistoryDto,
  PlayersIntelligenceDto,
} from './players-api.contract';

const CONTRACT = 'players-composite-read-v1';
export const PLAYERS_REPOSITORY = new InjectionToken<PlayersRepository>('PLAYERS_REPOSITORY');

const errorMessage = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);

@Injectable()
export class PlayersApiRepository implements PlayersRepository {
  constructor(private readonly api: LegacyApiClient) {}

  async load(scope: PlayersScope): Promise<PlayersSnapshot> {
    const query = new URLSearchParams({
      report: scope.reportCode,
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    const historyQuery = new URLSearchParams({
      encounter: String(scope.encounterId),
      difficulty: String(scope.difficulty),
    });
    const [telemetryResult, intelligenceResult, historyResult] = await Promise.allSettled([
      firstValueFrom(
        this.api.get(`/api/wcl/telemetry?${query}` as `/api/${string}`, decodePlayersTelemetry),
      ),
      firstValueFrom(
        this.api.get(
          `/api/wcl/intelligence?${query}` as `/api/${string}`,
          decodePlayersIntelligence,
        ),
      ),
      firstValueFrom(
        this.api.get(
          `/api/wcl/home-history?${historyQuery}` as `/api/${string}`,
          decodePlayersHistory,
        ),
      ),
    ]);
    if (telemetryResult.status === 'rejected') throw telemetryResult.reason;
    if (
      intelligenceResult.status === 'rejected' &&
      intelligenceResult.reason instanceof ApiContractError
    )
      throw intelligenceResult.reason;
    if (historyResult.status === 'rejected' && historyResult.reason instanceof ApiContractError)
      throw historyResult.reason;
    const telemetry = telemetryResult.value;
    this.assertTelemetryScope(telemetry.reportCode, telemetry.encounter, scope);
    const intelligence =
      intelligenceResult.status === 'fulfilled' ? intelligenceResult.value : null;
    const history = historyResult.status === 'fulfilled' ? historyResult.value : null;
    if (intelligence) this.assertIntelligenceScope(intelligence, scope);
    if (history) this.assertHistoryScope(history, scope);

    const partialReasons = [...telemetry.partialReasons];
    if (intelligenceResult.status === 'rejected')
      partialReasons.push(
        `Reliability analysis unavailable: ${errorMessage(intelligenceResult.reason)}`,
      );
    if (historyResult.status === 'rejected')
      partialReasons.push(
        `Persisted HOME attendance unavailable: ${errorMessage(historyResult.reason)}`,
      );
    if (telemetry.players.length)
      partialReasons.push(
        'Roster coverage is limited to the selected best pull plus classified execution actors; a complete encounter-wide participant union is not yet produced by the backend.',
      );

    if (intelligence?.homeRaidEligible === false) {
      return {
        status: 'external-not-applicable',
        generatedAt: Math.max(telemetry.generatedAt, intelligence.generatedAt),
        reportCode: scope.reportCode,
        encounter: telemetry.encounter,
        players: [],
        reliabilityModelVersion: intelligence.reliabilityModelVersion,
        reliabilityState: 'not-applicable',
        reliabilityPolicy: intelligence.reliabilityPolicy,
        partialReasons,
        attendanceSemantics: history?.semantics ?? null,
        historyNetworkExecuted: history?.networkExecuted ?? null,
        omittedClassifiedActors: intelligence.matrix.length,
      };
    }

    const profiles = new Map(
      (intelligence?.profiles ?? []).map((profile) => [profile.actorId, profile]),
    );
    const matrix = new Map((intelligence?.matrix ?? []).map((row) => [row.actorId, row]));
    const matrixComplete = intelligence?.status === 'ready';
    const players: PlayersPlayer[] = telemetry.players.map((player) => {
      const execution = matrix.get(player.actorId) ?? null;
      const reliability = profiles.get(player.actorId) ?? null;
      const outputUnit =
        player.role === 'HEAL'
          ? 'HPS'
          : player.role === 'DPS' || player.role === 'TANK'
            ? 'DPS'
            : null;
      const candidate: PlayersPlayer = {
        actorId: player.actorId,
        name: player.name,
        className: player.className,
        spec: player.spec,
        role: player.role,
        server: player.server,
        source: 'best-pull-roster',
        bestPullOutput:
          outputUnit === 'HPS' ? player.hps : outputUnit === 'DPS' ? player.dps : null,
        outputUnit,
        encounterFacts: {
          deaths: player.deaths,
          meaningfulDeaths: player.meaningfulDeaths,
          firstDeaths: player.firstDeaths,
          interrupts: player.interrupts,
          dispels: player.dispels,
          classifiedFailures: execution ? execution.failures : matrixComplete ? 0 : null,
          recentFailures: execution ? execution.recentFailures : matrixComplete ? 0 : null,
          linkedDeaths: execution ? execution.linkedDeaths : matrixComplete ? 0 : null,
          mechanics: execution?.mechanics ?? {},
        },
        reliability,
        attendance: null,
      };
      return { ...candidate, attendance: joinAttendance(candidate, history?.rows ?? []) };
    });

    const known = new Set(players.map((player) => player.actorId));
    for (const execution of intelligence?.matrix ?? []) {
      if (known.has(execution.actorId)) continue;
      players.push(this.matrixOnlyPlayer(execution, profiles.get(execution.actorId) ?? null));
    }
    players.sort((a, b) => a.name.localeCompare(b.name));
    if (intelligence && !intelligence.profiles.length)
      partialReasons.push(
        'No Reliability profile set was produced for this HOME scope. Missing profiles are not treated as pending scores.',
      );
    const published = players.filter((player) => player.reliability?.status === 'published').length;
    const reliabilityState = published
      ? 'available'
      : intelligence?.profiles.length
        ? 'partial'
        : 'unavailable';
    return {
      status: players.length ? 'ready' : 'empty',
      generatedAt: Math.max(telemetry.generatedAt, intelligence?.generatedAt ?? 0),
      reportCode: scope.reportCode,
      encounter: telemetry.encounter,
      players,
      reliabilityModelVersion: intelligence?.reliabilityModelVersion ?? null,
      reliabilityState,
      reliabilityPolicy: intelligence?.reliabilityPolicy ?? null,
      partialReasons,
      attendanceSemantics: history?.semantics ?? null,
      historyNetworkExecuted: history?.networkExecuted ?? null,
      omittedClassifiedActors: 0,
    };
  }

  private matrixOnlyPlayer(
    execution: PlayerMatrixDto,
    reliability: PlayersPlayer['reliability'],
  ): PlayersPlayer {
    return {
      actorId: execution.actorId,
      name: execution.name,
      className: null,
      spec: null,
      role: null,
      server: null,
      source: 'classified-execution-actor',
      bestPullOutput: null,
      outputUnit: null,
      encounterFacts: {
        deaths: null,
        meaningfulDeaths: null,
        firstDeaths: null,
        interrupts: null,
        dispels: null,
        classifiedFailures: execution.failures,
        recentFailures: execution.recentFailures,
        linkedDeaths: execution.linkedDeaths,
        mechanics: execution.mechanics,
      },
      reliability,
      attendance: null,
    };
  }

  private assertTelemetryScope(
    reportCode: string,
    encounter: PlayersSnapshot['encounter'],
    scope: PlayersScope,
  ): void {
    if (reportCode !== scope.reportCode)
      throw new ApiContractError(CONTRACT, 'telemetry report differs from the explicit request');
    if (
      encounter &&
      (encounter.id !== scope.encounterId || encounter.difficulty !== scope.difficulty)
    )
      throw new ApiContractError(
        CONTRACT,
        'telemetry encounter+difficulty differs from the explicit request',
      );
  }

  private assertIntelligenceScope(intelligence: PlayersIntelligenceDto, scope: PlayersScope): void {
    if (
      intelligence.encounter &&
      (intelligence.encounter.id !== scope.encounterId ||
        intelligence.encounter.difficulty !== scope.difficulty)
    )
      throw new ApiContractError(
        CONTRACT,
        'intelligence encounter+difficulty differs from the explicit request',
      );
    for (const profile of intelligence.profiles) {
      if (
        profile.reportCode !== scope.reportCode ||
        profile.encounterId !== scope.encounterId ||
        profile.difficulty !== scope.difficulty
      )
        throw new ApiContractError(
          CONTRACT,
          `Reliability profile ${profile.actorId} crosses the requested scope`,
        );
    }
  }

  private assertHistoryScope(history: PlayersHistoryDto, scope: PlayersScope): void {
    if (
      history.encounter &&
      (history.encounter.id !== scope.encounterId ||
        history.encounter.difficulty !== scope.difficulty)
    )
      throw new ApiContractError(
        CONTRACT,
        'HOME attendance encounter+difficulty differs from the explicit request',
      );
  }
}

export const PLAYERS_PROVIDERS = [
  PlayersApiRepository,
  { provide: PLAYERS_REPOSITORY, useExisting: PlayersApiRepository },
];
