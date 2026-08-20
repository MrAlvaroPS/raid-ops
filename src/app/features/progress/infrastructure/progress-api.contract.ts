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
  ProgressAuditRow,
  ProgressEvidence,
  ProgressHistoryIndex,
  ProgressMatrixWindow,
  ProgressModel,
  ProgressNight,
  ProgressPull,
  ProgressQualityGrade,
  ProgressScope,
  ProgressScopeOption,
  ProgressSnapshot,
  ProgressStateSignal,
} from '../domain/progress.models';

const CONTRACT = 'avoid-history-read-v1/progress-model-v2';
const textList = (value: unknown): readonly string[] =>
  Array.isArray(value)
    ? value.map(optionalText).filter((item): item is string => item != null)
    : [];
const numberList = (value: unknown): readonly number[] =>
  Array.isArray(value)
    ? value.map(optionalFiniteNumber).filter((item): item is number => item != null)
    : [];
const nullableNumber = (value: unknown): number | null => optionalFiniteNumber(value);

function decodeEvidence(value: unknown): ProgressEvidence {
  const row = requireRecord(value, CONTRACT);
  if (
    row['source'] !== 'persisted-home-history' ||
    row['homeOnly'] !== true ||
    row['activeReportDoesNotMutateHistory'] !== true ||
    row['difficultyClassifiedPerFight'] !== true ||
    row['crossDifficultyAggregationForbidden'] !== true ||
    row['readPathWclNetwork'] !== false
  ) {
    throw new ApiContractError(CONTRACT, 'persisted HOME evidence isolation is missing');
  }
  return {
    source: 'persisted-home-history',
    homeOnly: true,
    activeReportDoesNotMutateHistory: true,
    difficultyClassifiedPerFight: true,
    crossDifficultyAggregationForbidden: true,
    readPathWclNetwork: false,
  };
}

function assertLocalRead(root: Record<string, unknown>): void {
  if (root['ok'] !== true || root['version'] !== 'avoid-history-read-v1')
    throw new ApiContractError(CONTRACT, 'unexpected history read contract');
  if (root['networkExecuted'] !== false || nonNegativeNumber(root['wclCallsExecuted']) !== 0)
    throw new ApiContractError(CONTRACT, 'normal Progress read must execute zero WCL calls');
}

function decodeZone(value: unknown): { readonly id: number; readonly name: string | null } | null {
  const row = optionalRecord(value);
  return row
    ? {
        id: requirePositiveInteger(row['id'], 'zone.id', CONTRACT),
        name: optionalText(row['name']),
      }
    : null;
}

export function decodeProgressHistoryIndex(value: unknown): ProgressHistoryIndex {
  const root = requireRecord(value, CONTRACT);
  assertLocalRead(root);
  const zone = decodeZone(root['zone']);
  const evidence =
    root['evidenceContract'] == null ? null : decodeEvidence(root['evidenceContract']);
  if (zone && !evidence)
    throw new ApiContractError(CONTRACT, 'history index omits its evidence contract');
  const map = new Map<
    string,
    { option: Omit<ProgressScopeOption, 'reportCount'>; reports: Set<string> }
  >();
  for (const item of Array.isArray(root['pulls']) ? root['pulls'] : []) {
    const row = requireRecord(item, CONTRACT);
    if (row['mode'] !== 'single') continue;
    const encounterId = requirePositiveInteger(row['encounterId'], 'pull.encounterId', CONTRACT);
    const difficulty = requirePositiveInteger(row['difficulty'], 'pull.difficulty', CONTRACT);
    const scopeKey = optionalText(row['scopeKey']) ?? `${encounterId}:d${difficulty}`;
    if (scopeKey !== `${encounterId}:d${difficulty}`)
      throw new ApiContractError(CONTRACT, 'index scope key contradicts encounter+difficulty');
    const reportCode = optionalText(row['reportCode']);
    const absolute =
      nonNegativeNumber(row['reportStartTime']) + nonNegativeNumber(row['fightStartTime']);
    const current = map.get(scopeKey);
    if (!current) {
      map.set(scopeKey, {
        option: {
          encounterId,
          difficulty,
          scopeKey,
          bossName: optionalText(row['bossName']) ?? `Encounter ${encounterId}`,
          difficultyName: optionalText(row['difficultyName']) ?? `Difficulty ${difficulty}`,
          completedPulls: 1,
          kills: row['kill'] === true ? 1 : 0,
          latestAbsoluteStartTime: absolute,
        },
        reports: new Set(reportCode ? [reportCode] : []),
      });
    } else {
      current.option = {
        ...current.option,
        bossName:
          absolute >= current.option.latestAbsoluteStartTime
            ? (optionalText(row['bossName']) ?? current.option.bossName)
            : current.option.bossName,
        completedPulls: current.option.completedPulls + 1,
        kills: current.option.kills + (row['kill'] === true ? 1 : 0),
        latestAbsoluteStartTime: Math.max(current.option.latestAbsoluteStartTime, absolute),
      };
      if (reportCode) current.reports.add(reportCode);
    }
  }
  const scopes = [...map.values()]
    .map(({ option, reports }) => ({ ...option, reportCount: reports.size }))
    .sort((a, b) => b.latestAbsoluteStartTime - a.latestAbsoluteStartTime);
  const statusText = optionalText(root['status']);
  const status =
    statusText === 'ready' || statusText === 'partial' || statusText === 'raid-catalog-missing'
      ? statusText
      : 'empty';
  return {
    status,
    zone,
    syncedAt: nullableNumber(root['syncedAt']),
    needsRefresh: root['needsRefresh'] === true,
    scopes,
    evidence,
  };
}

function decodePull(value: unknown, index: number): ProgressPull {
  const row = requireRecord(value, CONTRACT);
  const pullNumber = requirePositiveInteger(
    row['pullNumber'],
    `pulls[${index}].pullNumber`,
    CONTRACT,
  );
  const globalPullNumber = requirePositiveInteger(
    row['globalPullNumber'],
    `pulls[${index}].globalPullNumber`,
    CONTRACT,
  );
  if (pullNumber !== index + 1 || globalPullNumber !== pullNumber)
    throw new ApiContractError(CONTRACT, 'global pull numbers must be contiguous');
  return {
    pullNumber,
    globalPullNumber,
    sessionId:
      optionalText(row['sessionId']) ?? `session-${nonNegativeNumber(row['sessionIndex'], 1)}`,
    sessionIndex: nonNegativeNumber(row['sessionIndex'], 1),
    absoluteStartTime: nullableNumber(row['absoluteStartTime']),
    absoluteEndTime: nullableNumber(row['absoluteEndTime']),
    durationMs: nullableNumber(row['durationMs']),
    kill: row['kill'] === true,
    fightPercentage: nullableNumber(row['fightPercentage']),
    bossPercentage: nullableNumber(row['bossPercentage']),
    stageCount: Math.max(1, nonNegativeNumber(row['stageCount'], 1)),
    progressMetricEligible: row['progressMetricEligible'] === true,
    progressMetricReason: optionalText(row['progressMetricReason']) ?? 'unknown',
    progressMetricSeverity: optionalText(row['progressMetricSeverity']) ?? 'unknown',
    progressMetricFlags: textList(row['progressMetricFlags']),
    reportCodes: textList(row['reportCodes']),
    fightIds: numberList(row['fightIds']),
  };
}

function decodeSignal(value: unknown): ProgressStateSignal {
  const row = requireRecord(value, CONTRACT);
  return {
    key: optionalText(row['key']) ?? 'unknown',
    label: optionalText(row['label']) ?? 'PROGRESS SIGNAL',
    detail: optionalText(row['detail']) ?? 'No detail available.',
    tone: optionalText(row['tone']) ?? '',
  };
}

function decodeNight(value: unknown): ProgressNight {
  const row = requireRecord(value, CONTRACT);
  return {
    sessionId: optionalText(row['sessionId']) ?? 'unknown-session',
    sessionIndex: nonNegativeNumber(row['sessionIndex'], 1),
    startTime: nullableNumber(row['startTime']),
    endTime: nullableNumber(row['endTime']),
    title: optionalText(row['title']),
    pulls: nonNegativeNumber(row['pulls']),
    metricEligiblePulls: nonNegativeNumber(row['metricEligiblePulls']),
    metricExcludedPulls: nonNegativeNumber(row['metricExcludedPulls']),
    kills: nonNegativeNumber(row['kills']),
    bestFightPercentage: nullableNumber(row['bestFightPercentage']),
    medianFightPercentage: nullableNumber(row['medianFightPercentage']),
    deepPullRatePct: nullableNumber(row['deepPullRatePct']),
    medianDeltaPp: nullableNumber(row['medianDeltaPp']),
    firstGlobalPull: nullableNumber(row['firstGlobalPull']),
    lastGlobalPull: nullableNumber(row['lastGlobalPull']),
  };
}

function decodeMatrixWindow(value: unknown): ProgressMatrixWindow {
  const row = requireRecord(value, CONTRACT);
  return {
    eligibleFirst: nonNegativeNumber(row['eligibleFirst']),
    eligibleLast: nonNegativeNumber(row['eligibleLast']),
    firstGlobalPull: nullableNumber(row['firstGlobalPull']),
    lastGlobalPull: nullableNumber(row['lastGlobalPull']),
    pulls: nonNegativeNumber(row['pulls']),
    complete: row['complete'] === true,
    stages: (Array.isArray(row['stages']) ? row['stages'] : []).map((item) => {
      const stage = requireRecord(item, CONTRACT);
      return {
        stage: requirePositiveInteger(stage['stage'], 'matrix.stage', CONTRACT),
        hit: nonNegativeNumber(stage['hit']),
        pulls: nonNegativeNumber(stage['pulls']),
        ratePct: nullableNumber(stage['ratePct']),
      };
    }),
  };
}

function decodeAudit(value: unknown): ProgressAuditRow {
  const row = requireRecord(value, CONTRACT);
  return {
    globalPullNumber: requirePositiveInteger(
      row['globalPullNumber'],
      'audit.globalPullNumber',
      CONTRACT,
    ),
    sessionId: optionalText(row['sessionId']),
    reportCodes: textList(row['reportCodes']),
    fightIds: numberList(row['fightIds']),
    durationMs: nullableNumber(row['durationMs']),
    fightPercentage: nullableNumber(row['fightPercentage']),
    bossPercentage: nullableNumber(row['bossPercentage']),
    stageCount: Math.max(1, nonNegativeNumber(row['stageCount'], 1)),
    metricEligible: row['metricEligible'] === true,
    reason: optionalText(row['reason']) ?? 'unknown',
    flags: textList(row['flags']),
  };
}

function decodeModel(value: unknown, pulls: readonly ProgressPull[]): ProgressModel {
  const root = requireRecord(value, CONTRACT);
  if (root['modelVersion'] !== 'progress-model-v2' || root['metricsVersion'] !== '2.0.0')
    throw new ApiContractError(CONTRACT, 'only the active Progress v2 metric contract is accepted');
  const policy = requireRecord(root['policy'], CONTRACT),
    totals = requireRecord(root['totals'], CONTRACT),
    block = requireRecord(root['block'], CONTRACT),
    currentBlock = requireRecord(block['currentBlock'], CONTRACT),
    breakthrough = requireRecord(root['breakthrough'], CONTRACT),
    health = requireRecord(root['health'], CONTRACT),
    matrix = requireRecord(root['matrix'], CONTRACT),
    quality = requireRecord(root['dataQuality'], CONTRACT),
    diagnostics = requireRecord(root['diagnostics'], CONTRACT),
    invariantRows = requireRecord(diagnostics['invariants'], CONTRACT);
  const gradeText = optionalText(quality['grade'])?.toUpperCase();
  const grade: ProgressQualityGrade =
    gradeText === 'PARTIAL' || gradeText === 'REVIEW' || gradeText === 'BLOCKED'
      ? gradeText
      : 'GOOD';
  const invariants = Object.fromEntries(
    Object.entries(invariantRows).map(([key, flag]) => [key, flag === true]),
  );
  const model: ProgressModel = {
    modelVersion: 'progress-model-v2',
    metricsVersion: '2.0.0',
    policy: {
      currentFormPulls: nonNegativeNumber(policy['currentFormPulls']),
      previousFormPulls: nonNegativeNumber(policy['previousFormPulls']),
      deepPullMarginPp: nonNegativeNumber(policy['deepPullMarginPp']),
      breakthroughDepthPp: nonNegativeNumber(policy['breakthroughDepthPp']),
      retentionTolerancePp: nonNegativeNumber(policy['retentionTolerancePp']),
      matrixWindowPulls: nonNegativeNumber(policy['matrixWindowPulls']),
    },
    totals: {
      rawPulls: nonNegativeNumber(totals['rawPulls']),
      metricEligiblePulls: nonNegativeNumber(totals['metricEligiblePulls']),
      metricExcludedPulls: nonNegativeNumber(totals['metricExcludedPulls']),
      nights: nonNegativeNumber(totals['nights']),
      kills: nonNegativeNumber(totals['kills']),
    },
    block: {
      bestPct: nullableNumber(block['bestPct']),
      deepestStage: Math.max(1, nonNegativeNumber(block['deepestStage'], 1)),
      currentDeepRatePct: nullableNumber(block['currentDeepRatePct']),
      deepDeltaPp: nullableNumber(block['deepDeltaPp']),
      currentMedianPct: nullableNumber(block['currentMedianPct']),
      consistencyGapPp: nullableNumber(block['consistencyGapPp']),
      consistencyGapImprovementPp: nullableNumber(block['consistencyGapImprovementPp']),
      currentStageConversionPct: nullableNumber(block['currentStageConversionPct']),
      stageConversionDeltaPp: nullableNumber(block['stageConversionDeltaPp']),
      currentBlock: { metricEligiblePulls: nonNegativeNumber(currentBlock['metricEligiblePulls']) },
    },
    breakthrough: {
      latest: optionalRecord(breakthrough['latest'])
        ? {
            pullNumber: requirePositiveInteger(
              optionalRecord(breakthrough['latest'])!['pullNumber'],
              'breakthrough.pullNumber',
              CONTRACT,
            ),
            reasons: textList(optionalRecord(breakthrough['latest'])!['reasons']),
          }
        : null,
      pullsSince: nullableNumber(breakthrough['pullsSince']),
      nightsSince: nullableNumber(breakthrough['nightsSince']),
    },
    candidateState: decodeSignal(root['candidateState']),
    state: decodeSignal(root['state']),
    nights: (Array.isArray(root['nights']) ? root['nights'] : []).map(decodeNight),
    health: {
      phaseConversionPct: nullableNumber(health['phaseConversionPct']),
      phaseConversionDeltaPp: nullableNumber(health['phaseConversionDeltaPp']),
      retention: optionalRecord(health['retention']) ?? {},
      throughput: optionalRecord(health['throughput']) ?? {},
    },
    matrix: {
      deepestStage: Math.max(1, nonNegativeNumber(matrix['deepestStage'], 1)),
      windowSize: nonNegativeNumber(matrix['windowSize']),
      windows: (Array.isArray(matrix['windows']) ? matrix['windows'] : []).map(decodeMatrixWindow),
    },
    dataQuality: {
      grade,
      holdStrategicState: quality['holdStrategicState'] === true,
      rawPulls: nonNegativeNumber(quality['rawPulls']),
      metricEligiblePulls: nonNegativeNumber(quality['metricEligiblePulls']),
      metricExcludedPulls: nonNegativeNumber(quality['metricExcludedPulls']),
      notes: textList(quality['notes']),
      auditRows: (Array.isArray(quality['auditRows']) ? quality['auditRows'] : []).map(decodeAudit),
    },
    diagnostics: { invariants },
  };
  const eligible = pulls.filter((pull) => pull.progressMetricEligible).length;
  const nightRaw = model.nights.reduce((sum, night) => sum + night.pulls, 0),
    nightEligible = model.nights.reduce((sum, night) => sum + night.metricEligiblePulls, 0);
  if (
    model.totals.rawPulls !== pulls.length ||
    model.totals.metricEligiblePulls !== eligible ||
    model.totals.metricExcludedPulls !== pulls.length - eligible ||
    model.dataQuality.rawPulls !== pulls.length ||
    model.dataQuality.metricEligiblePulls !== eligible ||
    nightRaw !== pulls.length ||
    nightEligible !== eligible
  )
    throw new ApiContractError(CONTRACT, 'raw, eligible and night populations do not reconcile');
  return model;
}

export function decodeProgressSnapshot(value: unknown, scope: ProgressScope): ProgressSnapshot {
  const root = requireRecord(value, CONTRACT);
  assertLocalRead(root);
  const zone = decodeZone(root['zone']);
  if (!zone) throw new ApiContractError(CONTRACT, 'scoped history response has no raid zone');
  const evidence = decodeEvidence(root['evidenceContract']);
  const encounter = requireRecord(root['encounter'], CONTRACT);
  const id = requirePositiveInteger(encounter['id'], 'encounter.id', CONTRACT),
    difficulty = requirePositiveInteger(encounter['difficulty'], 'encounter.difficulty', CONTRACT),
    scopeKey = optionalText(encounter['scopeKey']) ?? `${id}:d${difficulty}`;
  if (id !== scope.encounterId || difficulty !== scope.difficulty || scopeKey !== scope.scopeKey)
    throw new ApiContractError(CONTRACT, 'response scope differs from the explicit HOME scope');
  const pulls = (Array.isArray(root['progressionPulls']) ? root['progressionPulls'] : []).map(
    decodePull,
  );
  const model = root['progressModel'] == null ? null : decodeModel(root['progressModel'], pulls);
  const invariantOk = model ? Object.values(model.diagnostics.invariants).every(Boolean) : true;
  const reports = Array.isArray(root['reportDiagnostics']) ? root['reportDiagnostics'] : [];
  for (const item of reports)
    if (nonNegativeNumber(requireRecord(item, CONTRACT)['difficulty']) !== scope.difficulty)
      throw new ApiContractError(CONTRACT, 'report diagnostics mix difficulties');
  return {
    status: !pulls.length
      ? 'empty'
      : !model || !invariantOk || model.dataQuality.grade === 'BLOCKED'
        ? 'blocked'
        : 'ready',
    zone,
    syncedAt: nullableNumber(root['syncedAt']),
    needsRefresh: root['needsRefresh'] === true,
    encounter: {
      id,
      name: optionalText(encounter['name']) ?? `Encounter ${id}`,
      difficulty,
      difficultyName: optionalText(encounter['difficultyName']) ?? `Difficulty ${difficulty}`,
      scopeKey,
    },
    pulls,
    model,
    reportCount: reports.length,
    evidence,
    emptyReason: pulls.length
      ? null
      : 'No completed persisted HOME pull exists for this encounter and difficulty.',
  };
}
