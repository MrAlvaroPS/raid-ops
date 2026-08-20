import {
  ApiContractError,
  nonNegativeNumber,
  optionalFiniteNumber,
  optionalRecord,
  optionalText,
  requirePositiveInteger,
  requireRecord,
} from '../../../core/http/api-contract';
import {
  AbsoluteStage,
  DamageHealingEncounter,
  DamageHealingScope,
  DamageHealingSnapshot,
  StageThroughput,
  ThroughputSummary,
  WclGraphSeries,
} from '../domain/damage-healing.models';

const REPORT_CONTRACT = 'wcl-damage-healing-report-v1';
const TELEMETRY_CONTRACT = 'wcl-damage-healing-telemetry-v1';
const VIEW_CONTRACT = 'damage-healing-view-v1';

export interface DamageHealingReportProjection {
  readonly status: 'ready' | 'empty';
  readonly generatedAt: number;
  readonly source: string;
  readonly reportCode: string;
  readonly encounter: DamageHealingEncounter | null;
  readonly bestPull: DamageHealingSnapshot['bestPull'];
  readonly raidDps: number | null;
  readonly raidHps: number | null;
  readonly stage3Dps: number | null;
  readonly overhealPct: number | null;
  readonly population: DamageHealingSnapshot['population'];
  readonly detailAvailable: boolean;
  readonly emptyReason: string | null;
}

export interface DamageHealingTelemetryProjection {
  readonly status: 'ready' | 'empty';
  readonly generatedAt: number;
  readonly source: string;
  readonly reportCode: string;
  readonly encounter: DamageHealingEncounter | null;
  readonly bestPull: DamageHealingSnapshot['bestPull'];
  readonly best: ThroughputSummary | null;
  readonly stages: readonly StageThroughput[];
  readonly graphs: DamageHealingSnapshot['graphs'];
  readonly population: DamageHealingSnapshot['population'];
  readonly throughputError: boolean;
  readonly emptyReason: string | null;
}

function nullableNonNegative(value: unknown, field: string, contract: string): number | null {
  const number = optionalFiniteNumber(value);
  if (number == null) return null;
  if (number < 0) throw new ApiContractError(contract, `${field} cannot be negative`);
  return number;
}

function decodeEncounter(value: unknown, scope: DamageHealingScope, contract: string): DamageHealingEncounter | null {
  const row = optionalRecord(value);
  if (!row) return null;
  const id = requirePositiveInteger(row['id'], 'encounter.id', contract);
  const difficulty = requirePositiveInteger(row['difficulty'], 'encounter.difficulty', contract);
  const scopeKey = optionalText(row['scopeKey']) ?? `${id}:d${difficulty}`;
  if (id !== scope.encounterId || difficulty !== scope.difficulty || scopeKey !== `${id}:d${difficulty}`) {
    throw new ApiContractError(contract, 'response scope differs from the explicit request');
  }
  return {
    id,
    name: optionalText(row['name']),
    difficulty,
    difficultyName: optionalText(row['difficultyName']) ?? `Difficulty ${difficulty}`,
    scopeKey,
    pulls: nonNegativeNumber(row['pulls']),
  };
}

function assertEvidenceContract(root: Record<string, unknown>, contract: string): void {
  const evidence = requireRecord(root['evidenceContract'], contract);
  if (evidence['scopeIdentity'] !== 'encounter+difficulty' || evidence['crossDifficultyComparisonForbidden'] !== true) {
    throw new ApiContractError(contract, 'difficulty-isolation evidence contract is missing');
  }
}

function decodeStages(value: unknown, contract: string): readonly AbsoluteStage[] {
  if (!Array.isArray(value)) return [];
  const stages = value.map((item, index) => {
    const row = requireRecord(item, contract);
    const absoluteStageIndex = requirePositiveInteger(row['absoluteStageIndex'], `stages[${index}].absoluteStageIndex`, contract);
    const startTime = nullableNonNegative(row['startTime'], `stages[${index}].startTime`, contract);
    const endTime = nullableNonNegative(row['endTime'], `stages[${index}].endTime`, contract);
    if (startTime != null && endTime != null && endTime < startTime) {
      throw new ApiContractError(contract, `stages[${index}] ends before it starts`);
    }
    return {
      absoluteStageIndex,
      semanticPhaseId: nullableNonNegative(row['semanticPhaseId'], `stages[${index}].semanticPhaseId`, contract),
      startTime,
      endTime,
      inferred: row['inferred'] === true,
    };
  });
  if (stages.some((stage, index) => stage.absoluteStageIndex !== index + 1)) {
    throw new ApiContractError(contract, 'absolute stages must be ordered and contiguous');
  }
  return stages;
}

function decodeBestPull(value: unknown, contract: string): DamageHealingSnapshot['bestPull'] {
  const row = optionalRecord(value);
  if (!row) return null;
  const durationMs = nullableNonNegative(row['durationMs'], 'bestPull.durationMs', contract);
  if (!durationMs) throw new ApiContractError(contract, 'bestPull.durationMs must be positive');
  return {
    fightId: requirePositiveInteger(row['fightId'], 'bestPull.fightId', contract),
    pullNumber: requirePositiveInteger(row['pullNumber'], 'bestPull.pullNumber', contract),
    fightPercentage: nullableNonNegative(row['fightPercentage'], 'bestPull.fightPercentage', contract),
    durationMs,
    stages: decodeStages(row['stages'], contract),
  };
}

function decodePopulation(value: unknown): DamageHealingSnapshot['population'] {
  const row = optionalRecord(value);
  if (!row) return null;
  return {
    rawPulls: nonNegativeNumber(row['rawPulls']),
    eligiblePulls: nonNegativeNumber(row['eligiblePulls']),
    excludedPulls: Array.isArray(row['excludedPulls']) ? row['excludedPulls'].length : nonNegativeNumber(row['excludedPulls']),
    policy: optionalText(row['policy']) ?? 'Exact-scope analytical pulls; difficulty never mixed.',
  };
}

function decodeSummary(value: unknown, field: string): ThroughputSummary | null {
  const row = optionalRecord(value);
  if (!row) return null;
  return {
    damage: nullableNonNegative(row['damage'], `${field}.damage`, TELEMETRY_CONTRACT) ?? 0,
    healing: nullableNonNegative(row['healing'], `${field}.healing`, TELEMETRY_CONTRACT) ?? 0,
    dps: nullableNonNegative(row['dps'], `${field}.dps`, TELEMETRY_CONTRACT) ?? 0,
    hps: nullableNonNegative(row['hps'], `${field}.hps`, TELEMETRY_CONTRACT) ?? 0,
  };
}

function decodeGraph(value: unknown): WclGraphSeries | null {
  const outer = optionalRecord(value);
  const data = optionalRecord(outer?.['data']) ?? outer;
  if (!data || !Array.isArray(data['series'])) return null;
  const total = data['series'].map(optionalRecord).find(series => {
    const id = optionalText(series?.['id'])?.toLowerCase();
    const name = optionalText(series?.['name'])?.toLowerCase();
    return id === 'total' || name === 'total';
  });
  const values = total?.['data'];
  if (!Array.isArray(values) || values.length < 2) return null;
  const numbers = values.map(optionalFiniteNumber);
  if (numbers.some(number => number == null || number < 0)) return null;
  return { values: numbers as number[], sourceSeries: 'Total', semantics: 'ordered-wcl-graph-buckets' };
}

export function decodeDamageHealingReport(value: unknown, scope: DamageHealingScope): DamageHealingReportProjection {
  const root = requireRecord(value, REPORT_CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(REPORT_CONTRACT, 'response must declare ok=true');
  const configured = requireRecord(root['configured'], REPORT_CONTRACT);
  const report = requireRecord(root['report'], REPORT_CONTRACT);
  const reportCode = optionalText(report['code']) ?? optionalText(configured['reportCode']);
  if (reportCode !== scope.reportCode) throw new ApiContractError(REPORT_CONTRACT, 'report code differs from the explicit request');
  const encounter = decodeEncounter(root['encounter'], scope, REPORT_CONTRACT);
  if (!encounter) {
    return {
      status: 'empty', generatedAt: optionalFiniteNumber(root['generatedAt']) ?? Date.now(), source: optionalText(root['source']) ?? 'Warcraft Logs API v2',
      reportCode, encounter: null, bestPull: null, raidDps: null, raidHps: null, stage3Dps: null, overhealPct: null,
      population: decodePopulation(root['analysisPopulation']), detailAvailable: false,
      emptyReason: optionalText(root['message']) ?? 'No pull exists for this exact scope.',
    };
  }
  assertEvidenceContract(root, REPORT_CONTRACT);
  const phaseModel = requireRecord(root['phaseModel'], REPORT_CONTRACT);
  if (phaseModel['kind'] !== 'absolute-stage') throw new ApiContractError(REPORT_CONTRACT, 'absolute-stage phase model is required');
  const overview = requireRecord(root['overview'], REPORT_CONTRACT);
  const overhealPct = nullableNonNegative(overview['overhealPct'], 'overview.overhealPct', REPORT_CONTRACT);
  if (overhealPct != null && overhealPct > 100) throw new ApiContractError(REPORT_CONTRACT, 'overview.overhealPct cannot exceed 100');
  const diagnostics = optionalRecord(root['diagnostics']);
  return {
    status: 'ready', generatedAt: optionalFiniteNumber(root['generatedAt']) ?? Date.now(), source: optionalText(root['source']) ?? 'Warcraft Logs API v2',
    reportCode, encounter, bestPull: decodeBestPull(overview['bestPull'], REPORT_CONTRACT),
    raidDps: nullableNonNegative(overview['raidDps'], 'overview.raidDps', REPORT_CONTRACT),
    raidHps: nullableNonNegative(overview['raidHps'], 'overview.raidHps', REPORT_CONTRACT),
    stage3Dps: nullableNonNegative(overview['executeDps'], 'overview.executeDps', REPORT_CONTRACT),
    overhealPct, population: decodePopulation(root['analysisPopulation']),
    detailAvailable: diagnostics?.['detailStatus'] === 'ready', emptyReason: null,
  };
}

export function decodeDamageHealingTelemetry(value: unknown, scope: DamageHealingScope): DamageHealingTelemetryProjection {
  const root = requireRecord(value, TELEMETRY_CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(TELEMETRY_CONTRACT, 'response must declare ok=true');
  const reportCode = optionalText(root['reportCode']);
  if (reportCode !== scope.reportCode) throw new ApiContractError(TELEMETRY_CONTRACT, 'report code differs from the explicit request');
  const encounter = decodeEncounter(root['encounter'], scope, TELEMETRY_CONTRACT);
  if (root['telemetry'] === null || !encounter) {
    return {
      status: 'empty', generatedAt: optionalFiniteNumber(root['generatedAt']) ?? Date.now(), source: 'Warcraft Logs API v2', reportCode,
      encounter, bestPull: null, best: null, stages: [], graphs: { damage: null, healing: null }, population: decodePopulation(root['analysisPopulation']),
      throughputError: Boolean(optionalRecord(root['errors'])?.['throughput']), emptyReason: optionalText(root['reason']) ?? 'No completed pull exists for this exact scope.',
    };
  }
  assertEvidenceContract(root, TELEMETRY_CONTRACT);
  const phaseModel = requireRecord(root['phaseModel'], TELEMETRY_CONTRACT);
  if (phaseModel['kind'] !== 'absolute-stage') throw new ApiContractError(TELEMETRY_CONTRACT, 'absolute-stage phase model is required');
  const throughput = requireRecord(root['throughput'], TELEMETRY_CONTRACT);
  const phaseRows = requireRecord(throughput['phases'], TELEMETRY_CONTRACT);
  const stages = ([1, 2, 3] as const).map(index => {
    const summary = decodeSummary(phaseRows[`p${index}`], `throughput.phases.p${index}`);
    return { absoluteStageIndex: index, available: summary != null, ...(summary ?? { damage: 0, healing: 0, dps: 0, hps: 0 }) };
  });
  const graphs = optionalRecord(root['graphs']);
  const evidence = optionalRecord(root['evidence']);
  const errors = optionalRecord(root['errors']);
  return {
    status: 'ready', generatedAt: optionalFiniteNumber(root['generatedAt']) ?? Date.now(), source: optionalText(evidence?.['source']) ?? 'Warcraft Logs API v2',
    reportCode, encounter, bestPull: decodeBestPull(root['bestPull'], TELEMETRY_CONTRACT), best: decodeSummary(throughput['best'], 'throughput.best'), stages,
    graphs: { damage: decodeGraph(graphs?.['damage']), healing: decodeGraph(graphs?.['healing']) },
    population: decodePopulation(root['analysisPopulation']), throughputError: Boolean(errors?.['throughput']), emptyReason: null,
  };
}

function assertSameMetric(label: string, reportValue: number | null, telemetryValue: number | null): void {
  if (reportValue == null || telemetryValue == null) return;
  const tolerance = Math.max(1, Math.max(reportValue, telemetryValue) * 0.005);
  if (Math.abs(reportValue - telemetryValue) > tolerance) {
    throw new ApiContractError(VIEW_CONTRACT, `${label} contradicts across report and telemetry contracts`);
  }
}

export function composeDamageHealingSnapshot(
  scope: DamageHealingScope,
  report: DamageHealingReportProjection | null,
  telemetry: DamageHealingTelemetryProjection | null,
  unavailable: readonly ('report' | 'telemetry')[] = [],
): DamageHealingSnapshot {
  if (!report && !telemetry) throw new ApiContractError(VIEW_CONTRACT, 'both source contracts are unavailable');
  const readyReport = report?.status === 'ready' ? report : null;
  const readyTelemetry = telemetry?.status === 'ready' ? telemetry : null;
  if (readyReport?.encounter && readyTelemetry?.encounter && readyReport.encounter.scopeKey !== readyTelemetry.encounter.scopeKey) {
    throw new ApiContractError(VIEW_CONTRACT, 'report and telemetry scopes contradict');
  }
  if (readyReport?.bestPull && readyTelemetry?.bestPull && readyReport.bestPull.fightId !== readyTelemetry.bestPull.fightId) {
    throw new ApiContractError(VIEW_CONTRACT, 'report and telemetry best pulls contradict');
  }
  assertSameMetric('raid DPS', readyReport?.raidDps ?? null, readyTelemetry?.best?.dps ?? null);
  assertSameMetric('raid HPS', readyReport?.raidHps ?? null, readyTelemetry?.best?.hps ?? null);
  assertSameMetric('stage 3 DPS', readyReport?.stage3Dps ?? null, readyTelemetry?.stages[2]?.available ? readyTelemetry.stages[2].dps : null);

  const encounter = readyTelemetry?.encounter ?? readyReport?.encounter ?? telemetry?.encounter ?? report?.encounter ?? null;
  const bestPull = readyTelemetry?.bestPull ?? readyReport?.bestPull ?? null;
  const partialReasons = new Set<string>();
  unavailable.forEach(source => partialReasons.add(`${source} endpoint unavailable`));
  if (!readyTelemetry) partialReasons.add('stage throughput and graphs unavailable');
  if (readyTelemetry?.throughputError) partialReasons.add('throughput evidence incomplete');
  if (readyTelemetry && !readyTelemetry.graphs.damage) partialReasons.add('damage graph unavailable');
  if (readyTelemetry && !readyTelemetry.graphs.healing) partialReasons.add('healing graph unavailable');
  if (!readyReport?.detailAvailable || readyReport.overhealPct == null) partialReasons.add('overheal unavailable');
  const status = encounter && bestPull && (readyReport || readyTelemetry) ? 'ready' : 'empty';
  const emptyReason = status === 'empty'
    ? telemetry?.emptyReason ?? report?.emptyReason ?? 'No completed analytical pull exists for this exact scope.'
    : null;
  const generatedAt = Math.max(report?.generatedAt ?? 0, telemetry?.generatedAt ?? 0);
  return {
    status,
    generatedAt: generatedAt || Date.now(),
    reportCode: scope.reportCode,
    encounter,
    bestPull,
    metrics: {
      raidDps: readyTelemetry?.best?.dps ?? readyReport?.raidDps ?? null,
      raidHps: readyTelemetry?.best?.hps ?? readyReport?.raidHps ?? null,
      stage3Dps: readyTelemetry?.stages[2]?.available ? readyTelemetry.stages[2].dps : readyReport?.stage3Dps ?? null,
      overhealPct: readyReport?.overhealPct ?? null,
      healingDeathGapMs: null,
    },
    stages: readyTelemetry?.stages ?? [],
    graphs: readyTelemetry?.graphs ?? { damage: null, healing: null },
    population: readyTelemetry?.population ?? readyReport?.population ?? null,
    partialReasons: [...partialReasons],
    emptyReason,
    evidence: status === 'ready' ? {
      source: readyTelemetry?.source ?? readyReport?.source ?? 'Warcraft Logs API v2',
      scopeIdentity: 'encounter+difficulty', phaseModel: 'absolute-stage', graphSemantics: 'ordered-wcl-graph-buckets',
      metricContract: 'damage-healing-view-v1', crossDifficultyComparisonForbidden: true,
    } : null,
  };
}
