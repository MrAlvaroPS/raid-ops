export type ProgressRange = 'all' | '100' | '50' | '25';
export type ProgressQualityGrade = 'GOOD' | 'PARTIAL' | 'REVIEW' | 'BLOCKED';

export interface ProgressScope {
  readonly encounterId: number;
  readonly difficulty: number;
  readonly scopeKey: string;
}

export interface ProgressScopeOption extends ProgressScope {
  readonly bossName: string;
  readonly difficultyName: string;
  readonly completedPulls: number;
  readonly kills: number;
  readonly reportCount: number;
  readonly latestAbsoluteStartTime: number;
}

export interface ProgressHistoryIndex {
  readonly status: 'ready' | 'partial' | 'empty' | 'raid-catalog-missing';
  readonly zone: { readonly id: number; readonly name: string | null } | null;
  readonly syncedAt: number | null;
  readonly needsRefresh: boolean;
  readonly scopes: readonly ProgressScopeOption[];
  readonly evidence: ProgressEvidence | null;
}

export interface ProgressPull {
  readonly pullNumber: number;
  readonly globalPullNumber: number;
  readonly sessionId: string;
  readonly sessionIndex: number;
  readonly absoluteStartTime: number | null;
  readonly absoluteEndTime: number | null;
  readonly durationMs: number | null;
  readonly kill: boolean;
  readonly fightPercentage: number | null;
  readonly bossPercentage: number | null;
  readonly stageCount: number;
  readonly progressMetricEligible: boolean;
  readonly progressMetricReason: string;
  readonly progressMetricSeverity: string;
  readonly progressMetricFlags: readonly string[];
  readonly reportCodes: readonly string[];
  readonly fightIds: readonly number[];
}

export interface ProgressStateSignal {
  readonly key: string;
  readonly label: string;
  readonly detail: string;
  readonly tone: string;
}

export interface ProgressNight {
  readonly sessionId: string;
  readonly sessionIndex: number;
  readonly startTime: number | null;
  readonly endTime: number | null;
  readonly title: string | null;
  readonly pulls: number;
  readonly metricEligiblePulls: number;
  readonly metricExcludedPulls: number;
  readonly kills: number;
  readonly bestFightPercentage: number | null;
  readonly medianFightPercentage: number | null;
  readonly deepPullRatePct: number | null;
  readonly medianDeltaPp: number | null;
  readonly firstGlobalPull: number | null;
  readonly lastGlobalPull: number | null;
}

export interface ProgressMatrixWindow {
  readonly eligibleFirst: number;
  readonly eligibleLast: number;
  readonly firstGlobalPull: number | null;
  readonly lastGlobalPull: number | null;
  readonly pulls: number;
  readonly complete: boolean;
  readonly stages: readonly {
    readonly stage: number;
    readonly hit: number;
    readonly pulls: number;
    readonly ratePct: number | null;
  }[];
}

export interface ProgressAuditRow {
  readonly globalPullNumber: number;
  readonly sessionId: string | null;
  readonly reportCodes: readonly string[];
  readonly fightIds: readonly number[];
  readonly durationMs: number | null;
  readonly fightPercentage: number | null;
  readonly bossPercentage: number | null;
  readonly stageCount: number;
  readonly metricEligible: boolean;
  readonly reason: string;
  readonly flags: readonly string[];
}

export interface ProgressModel {
  readonly modelVersion: 'progress-model-v2';
  readonly metricsVersion: '2.0.0';
  readonly policy: {
    readonly currentFormPulls: number;
    readonly previousFormPulls: number;
    readonly deepPullMarginPp: number;
    readonly breakthroughDepthPp: number;
    readonly retentionTolerancePp: number;
    readonly matrixWindowPulls: number;
  };
  readonly totals: {
    readonly rawPulls: number;
    readonly metricEligiblePulls: number;
    readonly metricExcludedPulls: number;
    readonly nights: number;
    readonly kills: number;
  };
  readonly block: {
    readonly bestPct: number | null;
    readonly deepestStage: number;
    readonly currentDeepRatePct: number | null;
    readonly deepDeltaPp: number | null;
    readonly currentMedianPct: number | null;
    readonly consistencyGapPp: number | null;
    readonly consistencyGapImprovementPp: number | null;
    readonly currentStageConversionPct: number | null;
    readonly stageConversionDeltaPp: number | null;
    readonly currentBlock: { readonly metricEligiblePulls: number };
  };
  readonly breakthrough: {
    readonly latest: { readonly pullNumber: number; readonly reasons: readonly string[] } | null;
    readonly pullsSince: number | null;
    readonly nightsSince: number | null;
  };
  readonly candidateState: ProgressStateSignal;
  readonly state: ProgressStateSignal;
  readonly nights: readonly ProgressNight[];
  readonly health: {
    readonly phaseConversionPct: number | null;
    readonly phaseConversionDeltaPp: number | null;
    readonly retention: Record<string, unknown>;
    readonly throughput: Record<string, unknown>;
  };
  readonly matrix: {
    readonly deepestStage: number;
    readonly windowSize: number;
    readonly windows: readonly ProgressMatrixWindow[];
  };
  readonly dataQuality: {
    readonly grade: ProgressQualityGrade;
    readonly holdStrategicState: boolean;
    readonly rawPulls: number;
    readonly metricEligiblePulls: number;
    readonly metricExcludedPulls: number;
    readonly notes: readonly string[];
    readonly auditRows: readonly ProgressAuditRow[];
  };
  readonly diagnostics: {
    readonly invariants: Readonly<Record<string, boolean>>;
  };
}

export interface ProgressEvidence {
  readonly source: 'persisted-home-history';
  readonly homeOnly: true;
  readonly activeReportDoesNotMutateHistory: true;
  readonly difficultyClassifiedPerFight: true;
  readonly crossDifficultyAggregationForbidden: true;
  readonly readPathWclNetwork: false;
}

export interface ProgressSnapshot {
  readonly status: 'ready' | 'empty' | 'blocked';
  readonly zone: { readonly id: number; readonly name: string | null };
  readonly syncedAt: number | null;
  readonly needsRefresh: boolean;
  readonly encounter: {
    readonly id: number;
    readonly name: string;
    readonly difficulty: number;
    readonly difficultyName: string;
    readonly scopeKey: string;
  };
  readonly pulls: readonly ProgressPull[];
  readonly model: ProgressModel | null;
  readonly reportCount: number;
  readonly evidence: ProgressEvidence;
  readonly emptyReason: string | null;
}

export interface ProgressDepthSummary {
  readonly measured: readonly ProgressPull[];
  readonly eligible: readonly ProgressPull[];
  readonly unmeasuredEligible: readonly ProgressPull[];
  readonly coveragePct: number | null;
  readonly limited: boolean;
}

export interface ProgressChartPoint {
  readonly pullNumber: number;
  readonly x: number;
  readonly y: number;
  readonly value: number;
  readonly personalBest: boolean;
}

export interface ProgressChartSeries {
  readonly visible: readonly ProgressPull[];
  readonly measured: readonly ProgressChartPoint[];
  readonly bestLine: readonly ProgressChartPoint[];
  readonly formLine: readonly ProgressChartPoint[];
  readonly unmeasured: readonly { readonly pullNumber: number; readonly x: number }[];
  readonly nightBoundaries: readonly number[];
}
