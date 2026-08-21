import { WclScope } from '../../../shared/domain/wcl-scope';

export type CommandCenterScope = WclScope;

export interface CommandCenterPull {
  readonly fightId: number;
  readonly pullNumber: number;
  readonly kill: boolean;
  readonly fightPercentage: number | null;
  readonly durationMs: number;
  readonly stageCount: number;
  readonly meaningfulDeaths: number;
  readonly raidDps: number | null;
  readonly rosterFingerprint: string;
}

export type CommandCenterSignalStatus =
  'improved' | 'regressed' | 'stable' | 'observed' | 'unavailable';

export interface CommandCenterSignal {
  readonly key: 'progress' | 'stage' | 'meaningfulDeaths' | 'raidDps';
  readonly label: string;
  readonly status: CommandCenterSignalStatus;
  readonly current: number | null;
  readonly baseline: number | null;
  readonly delta: number | null;
  readonly unit: 'pp' | 'stage' | 'deaths' | 'dps';
  readonly evidence: string;
}

export interface CommandCenterComparison {
  readonly currentPull: number;
  readonly baselinePull: number;
  readonly rosterChanged: boolean;
  readonly signals: readonly CommandCenterSignal[];
}

export interface CommandCenterBlocker {
  readonly key: string;
  readonly name: string;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly failedOccurrences: number;
  readonly opportunities: number;
  readonly failureRate: number | null;
  readonly recentFailures: number;
  readonly affectedPulls: number;
  readonly linkedDeaths: number;
  readonly denominatorStatus: string;
  readonly scoringModel: string;
}

export interface CommandCenterSnapshot {
  readonly status: 'ready' | 'empty';
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: {
    readonly id: number;
    readonly name: string | null;
    readonly difficulty: number;
    readonly difficultyName: string;
    readonly scopeKey: string;
    readonly inProgress: boolean | null;
  } | null;
  readonly homeRaidEligible: boolean | null;
  readonly population: {
    readonly rawPulls: number;
    readonly eligiblePulls: number;
    readonly excludedPulls: number;
  } | null;
  readonly pulls: readonly CommandCenterPull[];
  readonly bestPull: CommandCenterPull | null;
  readonly latestPull: CommandCenterPull | null;
  readonly comparison: CommandCenterComparison | null;
  readonly deathCounts: {
    readonly raw: number;
    readonly meaningful: number;
    readonly first: number;
  } | null;
  readonly blocker: CommandCenterBlocker | null;
  readonly classificationStatus: 'ready' | 'insufficient-data' | 'gated';
  readonly classificationReason: string | null;
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
  readonly rulePack: {
    readonly slug: string | null;
    readonly version: string | null;
    readonly source: string | null;
  } | null;
  readonly evidence: {
    readonly source: 'Warcraft Logs API v2';
    readonly metricContract: 'command-center-operational-overview-v1';
    readonly scopeIdentity: 'report+encounter+difficulty';
    readonly refresh: 'manual-snapshot';
    readonly killReadiness: 'not-assessed';
    readonly causality: 'evidence-ranked-association-only';
    readonly crossDifficultyComparisonForbidden: true;
  };
}
