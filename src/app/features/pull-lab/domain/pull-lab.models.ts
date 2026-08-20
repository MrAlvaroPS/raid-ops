import { AbsoluteStage, StageBand } from '../../../shared/domain/absolute-stage';
import { WclScope } from '../../../shared/domain/wcl-scope';

export type PullLabScope = WclScope;
export type ComparisonStatus = 'improved' | 'regressed' | 'stable' | 'observed' | 'unavailable';

export interface PullDeath {
  readonly fightId: number;
  readonly actorId: number | null;
  readonly player: string | null;
  readonly fightRelativeMs: number | null;
  readonly abilityId: number | null;
  readonly killingBlow: string | null;
  readonly overkill: number | null;
}

export interface PullFact {
  readonly fightId: number;
  readonly pullNumber: number;
  readonly kill: boolean;
  readonly fightPercentage: number | null;
  readonly durationMs: number;
  readonly stageCount: number;
  readonly stages: readonly AbsoluteStage[];
  readonly stageBands: readonly StageBand[];
  readonly raidDps: number | null;
  readonly raidHps: number | null;
  readonly firstDeathMs: number | null;
  readonly rawDeaths: number;
  readonly meaningfulDeaths: number;
  readonly rawDeathTimeline: readonly PullDeath[];
  readonly meaningfulDeathTimeline: readonly PullDeath[];
  readonly rosterFingerprint: string;
  readonly rosterSize: number;
}

export interface ExcludedPull {
  readonly fightId: number;
  readonly pullNumber: number;
  readonly durationMs: number;
  readonly fightPercentage: number | null;
  readonly stageCount: number;
  readonly classification: string;
  readonly reason: string;
  readonly reasons: readonly string[];
}

export interface PullComparisonSignal {
  readonly key:
    'progress' | 'duration' | 'stage' | 'firstDeath' | 'meaningfulDeaths' | 'raidDps' | 'raidHps';
  readonly label: string;
  readonly status: ComparisonStatus;
  readonly current: number | null;
  readonly baseline: number | null;
  readonly delta: number | null;
  readonly unit: 'pp' | 'ms' | 'stage' | 'deaths' | 'dps' | 'hps';
  readonly evidence: string;
}

export interface PullComparison {
  readonly pullA: PullFact;
  readonly pullB: PullFact;
  readonly sameStage: boolean;
  readonly rosterChanged: boolean;
  readonly signals: readonly PullComparisonSignal[];
}

export interface MechanicObservation {
  readonly fightId: number;
  readonly key: string;
  readonly name: string;
  readonly occurrences: number;
  readonly occurrenceSource: string;
  readonly affectedPlayers: number;
}

export interface MechanicFailure {
  readonly fightId: number;
  readonly mechanicKey: string;
  readonly mechanicName: string;
  readonly actorId: number | null;
  readonly reason: string;
}

export interface PullMechanics {
  readonly status: 'ready' | 'gated';
  readonly reason: string | null;
  readonly observations: readonly MechanicObservation[];
  readonly failures: readonly MechanicFailure[];
}

export interface PullLabSnapshot {
  readonly status: 'ready' | 'insufficient-data' | 'empty';
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: {
    readonly id: number;
    readonly name: string | null;
    readonly difficulty: number;
    readonly difficultyName: string;
    readonly scopeKey: string;
  } | null;
  readonly pulls: readonly PullFact[];
  readonly excludedPulls: readonly ExcludedPull[];
  readonly population: {
    readonly rawPulls: number;
    readonly eligiblePulls: number;
    readonly excludedPulls: number;
    readonly policy: string;
  } | null;
  readonly mechanics: PullMechanics;
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
  readonly evidence: {
    readonly source: 'Warcraft Logs API v2';
    readonly scopeIdentity: 'report+encounter+difficulty';
    readonly metricContract: 'pull-lab-comparison-v1';
    readonly phaseModel: 'absolute-stage';
    readonly crossDifficultyComparisonForbidden: true;
    readonly observedMechanicDoesNotImplyFailure: true;
  } | null;
}
