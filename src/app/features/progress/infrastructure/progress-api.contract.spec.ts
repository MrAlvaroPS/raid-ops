import { ApiContractError } from '../../../core/http/api-contract';
import { decodeProgressHistoryIndex, decodeProgressSnapshot } from './progress-api.contract';

const evidence = {
  source: 'persisted-home-history',
  homeOnly: true,
  activeReportDoesNotMutateHistory: true,
  difficultyClassifiedPerFight: true,
  crossDifficultyAggregationForbidden: true,
  readPathWclNetwork: false,
};
const scope = { encounterId: 3010, difficulty: 5, scopeKey: '3010:d5' };
const indexPayload = () => ({
  ok: true,
  version: 'avoid-history-read-v1',
  status: 'ready',
  zone: { id: 42, name: 'Sanitized Raid' },
  syncedAt: 10,
  needsRefresh: false,
  networkExecuted: false,
  wclCallsExecuted: 0,
  evidenceContract: evidence,
  pulls: [
    { mode: 'all', key: 'all', label: 'All pulls' },
    {
      mode: 'single',
      encounterId: 3010,
      difficulty: 5,
      scopeKey: '3010:d5',
      bossName: 'Sanitized Boss',
      difficultyName: 'Mythic',
      reportCode: 'A',
      reportStartTime: 1000,
      fightStartTime: 100,
      kill: false,
    },
    {
      mode: 'single',
      encounterId: 3010,
      difficulty: 5,
      scopeKey: '3010:d5',
      bossName: 'Sanitized Boss',
      difficultyName: 'Mythic',
      reportCode: 'B',
      reportStartTime: 2000,
      fightStartTime: 100,
      kill: true,
    },
  ],
});
const pulls = [
  {
    pullNumber: 1,
    globalPullNumber: 1,
    sessionId: 'n1',
    sessionIndex: 1,
    absoluteStartTime: 1000,
    absoluteEndTime: 61000,
    durationMs: 60000,
    kill: false,
    fightPercentage: 100,
    bossPercentage: 100,
    stageCount: 1,
    progressMetricEligible: true,
    progressMetricReason: 'wcl-no-measurable-completion',
    progressMetricSeverity: 'review',
    progressMetricFlags: ['exact-100-fight-progress'],
    reportCodes: ['A'],
    fightIds: [1],
  },
  {
    pullNumber: 2,
    globalPullNumber: 2,
    sessionId: 'n1',
    sessionIndex: 1,
    absoluteStartTime: 70000,
    absoluteEndTime: 130000,
    durationMs: 60000,
    kill: false,
    fightPercentage: 62,
    bossPercentage: 62,
    stageCount: 2,
    progressMetricEligible: true,
    progressMetricReason: 'wcl-fight-percentage',
    progressMetricSeverity: 'confirmed',
    progressMetricFlags: [],
    reportCodes: ['B'],
    fightIds: [2],
  },
];
const model = () => ({
  modelVersion: 'progress-model-v2',
  metricsVersion: '2.0.0',
  policy: {
    currentFormPulls: 20,
    previousFormPulls: 20,
    deepPullMarginPp: 10,
    breakthroughDepthPp: 2,
    retentionTolerancePp: 2,
    matrixWindowPulls: 20,
  },
  totals: { rawPulls: 2, metricEligiblePulls: 2, metricExcludedPulls: 0, nights: 1, kills: 0 },
  block: {
    bestPct: 62,
    deepestStage: 2,
    currentDeepRatePct: 50,
    deepDeltaPp: null,
    currentMedianPct: 81,
    consistencyGapPp: 19,
    consistencyGapImprovementPp: null,
    currentStageConversionPct: 50,
    stageConversionDeltaPp: null,
    currentBlock: { metricEligiblePulls: 2 },
  },
  breakthrough: { latest: { pullNumber: 2, reasons: ['stage 2'] }, pullsSince: 0, nightsSince: 0 },
  candidateState: {
    key: 'baseline',
    label: 'BUILDING BASELINE',
    tone: '',
    detail: '2/20 metric-eligible pulls',
  },
  state: {
    key: 'baseline',
    label: 'BUILDING BASELINE',
    tone: '',
    detail: '2/20 metric-eligible pulls',
  },
  nights: [
    {
      sessionId: 'n1',
      sessionIndex: 1,
      startTime: 1000,
      endTime: 130000,
      title: 'Night',
      pulls: 2,
      metricEligiblePulls: 2,
      metricExcludedPulls: 0,
      kills: 0,
      bestFightPercentage: 62,
      medianFightPercentage: 81,
      deepPullRatePct: 50,
      medianDeltaPp: null,
      firstGlobalPull: 1,
      lastGlobalPull: 2,
    },
  ],
  health: {
    phaseConversionPct: 50,
    phaseConversionDeltaPp: null,
    retention: { available: false, reason: 'need-two-nights' },
    throughput: { available: true, current: { pullsPerHour: 30 } },
  },
  matrix: {
    deepestStage: 2,
    windowSize: 20,
    windows: [
      {
        eligibleFirst: 1,
        eligibleLast: 2,
        firstGlobalPull: 1,
        lastGlobalPull: 2,
        pulls: 2,
        complete: false,
        stages: [
          { stage: 1, hit: 2, pulls: 2, ratePct: 100 },
          { stage: 2, hit: 1, pulls: 2, ratePct: 50 },
        ],
      },
    ],
  },
  dataQuality: {
    grade: 'PARTIAL',
    holdStrategicState: false,
    rawPulls: 2,
    metricEligiblePulls: 2,
    metricExcludedPulls: 0,
    notes: ['1/2 exact 100'],
    auditRows: [
      {
        globalPullNumber: 1,
        sessionId: 'n1',
        reportCodes: ['A'],
        fightIds: [1],
        durationMs: 60000,
        fightPercentage: 100,
        bossPercentage: 100,
        stageCount: 1,
        metricEligible: true,
        reason: 'wcl-no-measurable-completion',
        flags: ['exact-100-fight-progress'],
      },
    ],
  },
  diagnostics: {
    invariants: {
      nightRawPullsMatch: true,
      nightEligiblePullsMatch: true,
      globalPullNumbersContiguous: true,
      eligiblePullsReferenceCanonical: true,
      currentFormUsesEligiblePopulation: true,
    },
  },
});
const scopedPayload = () => ({
  ...indexPayload(),
  encounter: {
    id: 3010,
    name: 'Sanitized Boss',
    difficulty: 5,
    difficultyName: 'Mythic',
    scopeKey: '3010:d5',
  },
  progressionPulls: pulls,
  progressModel: model(),
  reportDiagnostics: [
    { reportCode: 'A', difficulty: 5 },
    { reportCode: 'B', difficulty: 5 },
  ],
});

describe('Persisted HOME Progress API contract', () => {
  it('groups the local pull index by exact encounter+difficulty and reports no WCL execution', () => {
    const index = decodeProgressHistoryIndex(indexPayload());
    expect(index.scopes).toEqual([
      expect.objectContaining({ scopeKey: '3010:d5', completedPulls: 2, kills: 1, reportCount: 2 }),
    ]);
  });

  it('accepts the active v2 model only when raw, eligible and night populations reconcile', () => {
    const result = decodeProgressSnapshot(scopedPayload(), scope);
    expect(result.status).toBe('ready');
    expect(result.model?.metricsVersion).toBe('2.0.0');
    expect(result.pulls[0].progressMetricFlags).toContain('exact-100-fight-progress');
  });

  it('blocks failed canonical invariants while retaining auditable rows', () => {
    const value = scopedPayload();
    value.progressModel.diagnostics.invariants.nightRawPullsMatch = false;
    expect(decodeProgressSnapshot(value, scope).status).toBe('blocked');
  });

  it('rejects WCL execution, scope drift and population contradictions', () => {
    const network = scopedPayload();
    network.wclCallsExecuted = 1;
    expect(() => decodeProgressSnapshot(network, scope)).toThrowError(ApiContractError);
    const drift = scopedPayload();
    drift.encounter.difficulty = 4;
    drift.encounter.scopeKey = '3010:d4';
    expect(() => decodeProgressSnapshot(drift, scope)).toThrowError(/response scope differs/);
    const mismatch = scopedPayload();
    mismatch.progressModel.totals.metricEligiblePulls = 1;
    expect(() => decodeProgressSnapshot(mismatch, scope)).toThrowError(/do not reconcile/);
  });
});
