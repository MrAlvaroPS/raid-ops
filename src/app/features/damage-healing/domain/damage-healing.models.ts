import { WclScope } from '../../../shared/domain/wcl-scope';
import { AbsoluteStage, StageBand } from '../../../shared/domain/absolute-stage';

export type { AbsoluteStage, StageBand } from '../../../shared/domain/absolute-stage';

export type DamageHealingScope = WclScope;
export type ThroughputMode = 'damage' | 'healing';

export interface DamageHealingEncounter {
  readonly id: number;
  readonly name: string | null;
  readonly difficulty: number;
  readonly difficultyName: string;
  readonly scopeKey: string;
  readonly pulls: number;
}

export interface ThroughputSummary {
  readonly damage: number;
  readonly healing: number;
  readonly dps: number;
  readonly hps: number;
}

export interface StageThroughput extends ThroughputSummary {
  readonly absoluteStageIndex: 1 | 2 | 3;
  readonly available: boolean;
}

export interface WclGraphSeries {
  readonly values: readonly number[];
  readonly sourceSeries: 'Total';
  readonly semantics: 'ordered-wcl-graph-buckets';
}

export interface DamageHealingSnapshot {
  readonly status: 'ready' | 'empty';
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: DamageHealingEncounter | null;
  readonly bestPull: {
    readonly fightId: number;
    readonly pullNumber: number;
    readonly fightPercentage: number | null;
    readonly durationMs: number;
    readonly stages: readonly AbsoluteStage[];
  } | null;
  readonly metrics: {
    readonly raidDps: number | null;
    readonly raidHps: number | null;
    readonly stage3Dps: number | null;
    readonly overhealPct: number | null;
    readonly healingDeathGapMs: null;
  };
  readonly stages: readonly StageThroughput[];
  readonly graphs: {
    readonly damage: WclGraphSeries | null;
    readonly healing: WclGraphSeries | null;
  };
  readonly population: {
    readonly rawPulls: number;
    readonly eligiblePulls: number;
    readonly excludedPulls: number;
    readonly policy: string;
  } | null;
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
  readonly evidence: {
    readonly source: string;
    readonly scopeIdentity: 'encounter+difficulty';
    readonly phaseModel: 'absolute-stage';
    readonly graphSemantics: 'ordered-wcl-graph-buckets';
    readonly metricContract: 'damage-healing-view-v1';
    readonly crossDifficultyComparisonForbidden: true;
  } | null;
}

export interface ChartPoint {
  readonly x: number;
  readonly y: number;
}
