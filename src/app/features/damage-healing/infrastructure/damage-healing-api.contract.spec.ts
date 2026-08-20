import { ApiContractError } from '../../../core/http/api-contract';
import {
  composeDamageHealingSnapshot,
  decodeDamageHealingReport,
  decodeDamageHealingTelemetry,
} from './damage-healing-api.contract';

const scope = { reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 as const };
const stages = [
  { absoluteStageIndex: 1, semanticPhaseId: 1, startTime: 1000, endTime: 41_000 },
  { absoluteStageIndex: 2, semanticPhaseId: 2, startTime: 41_000, endTime: 81_000 },
  { absoluteStageIndex: 3, semanticPhaseId: 1, startTime: 81_000, endTime: 101_000 },
];
const encounter = { id: 3010, name: 'Test Boss', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5', pulls: 4 };
const bestPull = { fightId: 77, pullNumber: 4, fightPercentage: 12.5, durationMs: 100_000, stages };
const evidenceContract = { scopeIdentity: 'encounter+difficulty', crossDifficultyComparisonForbidden: true };
const reportPayload = {
  ok: true, generatedAt: 1, source: 'Warcraft Logs API v2', configured: { reportCode: 'ABC123XYZ' }, report: { code: 'ABC123XYZ' },
  encounter, phaseModel: { kind: 'absolute-stage', semanticPhaseIdsMayRepeat: true }, analysisPopulation: { rawPulls: 5, eligiblePulls: 4, excludedPulls: [{}], policy: 'test' },
  overview: { bestPull, raidDps: 1_000_000, raidHps: 200_000, executeDps: 1_200_000, overhealPct: 25 }, diagnostics: { detailStatus: 'ready' }, evidenceContract,
};
const telemetryPayload = {
  ok: true, generatedAt: 2, reportCode: 'ABC123XYZ', encounter, bestPull,
  phaseModel: { kind: 'absolute-stage', semanticPhaseSequence: [1, 2, 1] },
  throughput: {
    best: { damage: 100_000_000, healing: 20_000_000, dps: 1_000_000, hps: 200_000 },
    phases: {
      p1: { damage: 40_000_000, healing: 8_000_000, dps: 1_000_000, hps: 200_000 },
      p2: { damage: 36_000_000, healing: 8_000_000, dps: 900_000, hps: 200_000 },
      p3: { damage: 24_000_000, healing: 4_000_000, dps: 1_200_000, hps: 200_000 },
    },
  },
  graphs: {
    damage: { data: { series: [{ name: 'Total', data: [10, 30, 20] }] } },
    healing: { data: { series: [{ id: 'total', data: [5, 9, 6] }] } },
  },
  analysisPopulation: { rawPulls: 5, eligiblePulls: 4, excludedPulls: [{}], policy: 'test' },
  evidence: { source: 'Warcraft Logs API v2' }, errors: {}, evidenceContract,
};

describe('Damage & Healing API contracts', () => {
  it('composes the two existing exact-scope reads without relabelling stage 3 as execute', () => {
    const report = decodeDamageHealingReport(reportPayload, scope);
    const telemetry = decodeDamageHealingTelemetry(telemetryPayload, scope);
    const result = composeDamageHealingSnapshot(scope, report, telemetry);
    expect(result).toMatchObject({ status: 'ready', metrics: { raidDps: 1_000_000, stage3Dps: 1_200_000, overhealPct: 25 } });
    expect(result.bestPull?.stages.map(stage => stage.semanticPhaseId)).toEqual([1, 2, 1]);
    expect(result.graphs.damage?.values).toEqual([10, 30, 20]);
    expect(result.metrics.healingDeathGapMs).toBeNull();
    expect(result.generatedAt).toBe(2);
  });

  it('rejects difficulty-scope contradictions', () => {
    expect(() => decodeDamageHealingTelemetry({ ...telemetryPayload, encounter: { ...encounter, difficulty: 4, scopeKey: '3010:d4' } }, scope)).toThrowError(ApiContractError);
  });

  it('rejects best-pull contradictions instead of mixing evidence', () => {
    const report = decodeDamageHealingReport(reportPayload, scope);
    const telemetry = decodeDamageHealingTelemetry({ ...telemetryPayload, bestPull: { ...bestPull, fightId: 78 } }, scope);
    expect(() => composeDamageHealingSnapshot(scope, report, telemetry)).toThrowError(/best pulls contradict/);
  });

  it('rejects metric contradictions beyond the explicit tolerance', () => {
    const report = decodeDamageHealingReport(reportPayload, scope);
    const telemetry = decodeDamageHealingTelemetry({ ...telemetryPayload, throughput: { ...telemetryPayload.throughput, best: { ...telemetryPayload.throughput.best, dps: 800_000 } } }, scope);
    expect(() => composeDamageHealingSnapshot(scope, report, telemetry)).toThrowError(/raid DPS contradicts/);
  });

  it('drops malformed graphs as partial evidence without inventing buckets', () => {
    const telemetry = decodeDamageHealingTelemetry({ ...telemetryPayload, graphs: { ...telemetryPayload.graphs, damage: { data: { series: [{ name: 'Total', data: [10, 'bad', 20] }] } } } }, scope);
    const result = composeDamageHealingSnapshot(scope, decodeDamageHealingReport(reportPayload, scope), telemetry);
    expect(result.graphs.damage).toBeNull();
    expect(result.partialReasons).toContain('damage graph unavailable');
  });

  it('keeps missing stage 2 or 3 explicit rather than duplicating another stage', () => {
    const telemetry = decodeDamageHealingTelemetry({ ...telemetryPayload, throughput: { ...telemetryPayload.throughput, phases: { p1: telemetryPayload.throughput.phases.p1, p2: null, p3: null } } }, scope);
    expect(telemetry.stages.map(stage => stage.available)).toEqual([true, false, false]);
  });
});
