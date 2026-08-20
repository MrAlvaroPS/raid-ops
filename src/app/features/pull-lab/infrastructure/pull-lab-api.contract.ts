import {
  ApiContractError,
  nonNegativeNumber,
  optionalFiniteNumber,
  optionalRecord,
  optionalText,
  requirePositiveInteger,
  requireRecord,
} from '../../../core/http/api-contract';
import { absoluteStageBands, AbsoluteStage } from '../../../shared/domain/absolute-stage';
import {
  ExcludedPull,
  MechanicFailure,
  MechanicObservation,
  PullDeath,
  PullFact,
  PullLabScope,
  PullLabSnapshot,
} from '../domain/pull-lab.models';

const CONTRACT = 'pull-lab-operational-view-v1';

function nullableNonNegative(value: unknown, field: string): number | null {
  const number = optionalFiniteNumber(value);
  if (number == null) return null;
  if (number < 0) throw new ApiContractError(CONTRACT, `${field} cannot be negative`);
  return number;
}

function decodeStages(value: unknown): readonly AbsoluteStage[] {
  if (!Array.isArray(value)) return [];
  const stages = value.map((item, index) => {
    const row = requireRecord(item, CONTRACT);
    const absoluteStageIndex = requirePositiveInteger(
      row['absoluteStageIndex'],
      `stages[${index}].absoluteStageIndex`,
      CONTRACT,
    );
    const startTime = nullableNonNegative(row['startTime'], `stages[${index}].startTime`);
    const endTime = nullableNonNegative(row['endTime'], `stages[${index}].endTime`);
    if (startTime != null && endTime != null && endTime < startTime)
      throw new ApiContractError(CONTRACT, 'stage ends before it starts');
    return {
      absoluteStageIndex,
      semanticPhaseId: nullableNonNegative(
        row['semanticPhaseId'],
        `stages[${index}].semanticPhaseId`,
      ),
      startTime,
      endTime,
      inferred: row['inferred'] === true,
    };
  });
  if (stages.some((stage, index) => stage.absoluteStageIndex !== index + 1))
    throw new ApiContractError(CONTRACT, 'absolute stages must be contiguous');
  return stages;
}

function decodeDeath(value: unknown, fightId: number): PullDeath | null {
  const row = optionalRecord(value);
  if (!row) return null;
  const rowFightId = requirePositiveInteger(row['fightId'], 'death.fightId', CONTRACT);
  if (rowFightId !== fightId)
    throw new ApiContractError(CONTRACT, 'death belongs to another fight');
  return {
    fightId,
    actorId: nullableNonNegative(row['actorId'], 'death.actorId'),
    player: optionalText(row['player']),
    fightRelativeMs: nullableNonNegative(row['fightRelativeMs'], 'death.fightRelativeMs'),
    abilityId: nullableNonNegative(row['abilityId'], 'death.abilityId'),
    killingBlow: optionalText(row['killingBlow']),
    overkill: nullableNonNegative(row['overkill'], 'death.overkill'),
  };
}

function decodePull(value: unknown): PullFact {
  const row = requireRecord(value, CONTRACT);
  const fightId = requirePositiveInteger(row['fightId'], 'pull.fightId', CONTRACT);
  const durationMs = nullableNonNegative(row['durationMs'], 'pull.durationMs');
  if (!durationMs) throw new ApiContractError(CONTRACT, 'pull.durationMs must be positive');
  const stages = decodeStages(row['stages']);
  const deaths = (input: unknown) =>
    Array.isArray(input)
      ? input
          .map((item) => decodeDeath(item, fightId))
          .filter((item): item is PullDeath => item != null)
      : [];
  const rawDeathTimeline = deaths(row['rawDeathTimeline']);
  const meaningfulDeathTimeline = deaths(row['meaningfulDeathTimeline']);
  return {
    fightId,
    pullNumber: requirePositiveInteger(row['pullNumber'], 'pull.pullNumber', CONTRACT),
    kill: row['kill'] === true,
    fightPercentage: nullableNonNegative(row['fightPercentage'], 'pull.fightPercentage'),
    durationMs,
    stageCount: nonNegativeNumber(row['stageCount']),
    stages,
    stageBands: absoluteStageBands(stages, durationMs),
    raidDps: nullableNonNegative(row['raidDps'], 'pull.raidDps'),
    raidHps: nullableNonNegative(row['raidHps'], 'pull.raidHps'),
    firstDeathMs: nullableNonNegative(row['firstDeathMs'], 'pull.firstDeathMs'),
    rawDeaths: nonNegativeNumber(row['rawDeaths']),
    meaningfulDeaths: nonNegativeNumber(row['meaningfulDeaths']),
    rawDeathTimeline,
    meaningfulDeathTimeline,
    rosterFingerprint: typeof row['rosterFingerprint'] === 'string' ? row['rosterFingerprint'] : '',
    rosterSize: nonNegativeNumber(row['rosterSize']),
  };
}

function decodeExcluded(value: unknown): ExcludedPull {
  const row = requireRecord(value, CONTRACT);
  return {
    fightId: requirePositiveInteger(row['fightId'], 'excluded.fightId', CONTRACT),
    pullNumber: requirePositiveInteger(row['pullNumber'], 'excluded.pullNumber', CONTRACT),
    durationMs: nonNegativeNumber(row['durationMs']),
    fightPercentage: nullableNonNegative(row['fightPercentage'], 'excluded.fightPercentage'),
    stageCount: nonNegativeNumber(row['stageCount']),
    classification: optionalText(row['classification']) ?? 'excluded',
    reason: optionalText(row['reason']) ?? 'Excluded by the analytical population policy.',
    reasons: Array.isArray(row['reasons'])
      ? row['reasons'].map(optionalText).filter((item): item is string => item != null)
      : [],
  };
}

function decodeObservations(value: unknown, eligible: Set<number>): readonly MechanicObservation[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = requireRecord(item, CONTRACT);
    const fightId = requirePositiveInteger(row['fightId'], 'observation.fightId', CONTRACT);
    if (!eligible.has(fightId))
      throw new ApiContractError(CONTRACT, 'mechanic observation belongs to an excluded pull');
    return {
      fightId,
      key: optionalText(row['key']) ?? 'unknown',
      name: optionalText(row['name']) ?? 'Observed mechanic',
      occurrences: nonNegativeNumber(row['occurrences']),
      occurrenceSource: optionalText(row['occurrenceSource']) ?? 'observed event',
      affectedPlayers: nonNegativeNumber(row['affectedPlayers']),
    };
  });
}

function decodeFailures(value: unknown, eligible: Set<number>): readonly MechanicFailure[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = requireRecord(item, CONTRACT);
    const fightId = requirePositiveInteger(row['fightId'], 'failure.fightId', CONTRACT);
    if (!eligible.has(fightId))
      throw new ApiContractError(CONTRACT, 'mechanic failure belongs to an excluded pull');
    return {
      fightId,
      mechanicKey: optionalText(row['mechanicKey']) ?? 'unknown',
      mechanicName: optionalText(row['mechanicName']) ?? 'Classified mechanic',
      actorId: nullableNonNegative(row['actorId'], 'failure.actorId'),
      reason: optionalText(row['reason']) ?? 'Classified by the active mechanic rule pack.',
    };
  });
}

export function decodePullLabResponse(value: unknown, scope: PullLabScope): PullLabSnapshot {
  const root = requireRecord(value, CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(CONTRACT, 'response must declare ok=true');
  const generatedAt = optionalFiniteNumber(root['generatedAt']) ?? Date.now();
  const telemetry = optionalRecord(root['telemetry']);
  const status = optionalText(root['status']) ?? 'unknown';
  if (!telemetry)
    return {
      status: 'empty',
      generatedAt,
      reportCode: scope.reportCode,
      encounter: null,
      pulls: [],
      excludedPulls: [],
      population: null,
      mechanics: {
        status: 'gated',
        reason: 'Mechanic classification is unavailable without a completed analytical pull.',
        observations: [],
        failures: [],
      },
      partialReasons: [],
      emptyReason:
        status === 'waiting-for-first-combat'
          ? 'The report is waiting for its first combat.'
          : 'No completed analytical pull exists for this exact scope.',
      evidence: null,
    };
  if (optionalText(telemetry['reportCode']) !== scope.reportCode)
    throw new ApiContractError(CONTRACT, 'report code differs from the explicit request');
  const encounterRow = requireRecord(telemetry['encounter'], CONTRACT);
  const encounterId = requirePositiveInteger(encounterRow['id'], 'encounter.id', CONTRACT);
  const difficulty = requirePositiveInteger(
    encounterRow['difficulty'],
    'encounter.difficulty',
    CONTRACT,
  );
  const scopeKey = optionalText(encounterRow['scopeKey']) ?? `${encounterId}:d${difficulty}`;
  if (
    encounterId !== scope.encounterId ||
    difficulty !== scope.difficulty ||
    scopeKey !== `${encounterId}:d${difficulty}`
  )
    throw new ApiContractError(CONTRACT, 'response scope differs from the explicit request');
  const evidence = requireRecord(telemetry['evidenceContract'], CONTRACT);
  if (
    evidence['scopeIdentity'] !== 'encounter+difficulty' ||
    evidence['crossDifficultyComparisonForbidden'] !== true
  )
    throw new ApiContractError(CONTRACT, 'difficulty isolation evidence is missing');
  const intelligence = requireRecord(telemetry['pullIntelligence'], CONTRACT);
  const pulls = Array.isArray(intelligence['pulls']) ? intelligence['pulls'].map(decodePull) : [];
  const excludedPulls = Array.isArray(intelligence['excludedPulls'])
    ? intelligence['excludedPulls'].map(decodeExcluded)
    : [];
  const fightIds = pulls.map((pull) => pull.fightId);
  if (new Set(fightIds).size !== fightIds.length)
    throw new ApiContractError(CONTRACT, 'eligible pull IDs must be unique');
  const eligible = new Set(fightIds);
  const populationRow = optionalRecord(intelligence['analysisPopulation']);
  const population = populationRow
    ? {
        rawPulls: nonNegativeNumber(populationRow['rawPulls']),
        eligiblePulls: nonNegativeNumber(populationRow['eligiblePulls']),
        excludedPulls: Array.isArray(populationRow['excludedPulls'])
          ? populationRow['excludedPulls'].length
          : nonNegativeNumber(populationRow['excludedPulls']),
        policy:
          optionalText(populationRow['policy']) ??
          'Called-wipe/reset pulls remain visible but do not enter analytical comparisons.',
      }
    : null;
  if (
    population &&
    (population.eligiblePulls !== pulls.length ||
      population.excludedPulls !== excludedPulls.length ||
      population.rawPulls !== pulls.length + excludedPulls.length)
  ) {
    throw new ApiContractError(CONTRACT, 'analysis population contradicts pull intelligence');
  }
  const mechanicsRow = optionalRecord(root['mechanics']);
  const rootEvidence = optionalRecord(root['evidenceContract']);
  const mechanicsReady = status === 'ready' && mechanicsRow != null;
  if (mechanicsReady && rootEvidence?.['observedMechanicDoesNotImplyFailure'] !== true)
    throw new ApiContractError(CONTRACT, 'mechanic evidence separation is missing');
  const completeness = optionalRecord(root['dataCompleteness']);
  const partialReasons: string[] = [];
  if (
    completeness &&
    Object.values(completeness).some((row) => optionalRecord(row)?.['truncated'] === true)
  )
    partialReasons.push('Mechanic event evidence is truncated.');
  const resultStatus = pulls.length >= 2 ? 'ready' : pulls.length ? 'insufficient-data' : 'empty';
  return {
    status: resultStatus,
    generatedAt,
    reportCode: scope.reportCode,
    encounter: {
      id: encounterId,
      name: optionalText(encounterRow['name']),
      difficulty,
      difficultyName: optionalText(encounterRow['difficultyName']) ?? `Difficulty ${difficulty}`,
      scopeKey,
    },
    pulls,
    excludedPulls,
    population,
    mechanics: mechanicsReady
      ? {
          status: 'ready',
          reason: null,
          observations: decodeObservations(mechanicsRow['observations'], eligible),
          failures: decodeFailures(mechanicsRow['failures'], eligible),
        }
      : {
          status: 'gated',
          reason:
            'Mechanic classification is gated until an operational encounter reference is ready.',
          observations: [],
          failures: [],
        },
    partialReasons,
    emptyReason:
      resultStatus === 'empty'
        ? 'No completed analytical pull exists for this exact scope.'
        : resultStatus === 'insufficient-data'
          ? 'At least two eligible pulls are required for comparison.'
          : null,
    evidence: {
      source: 'Warcraft Logs API v2',
      scopeIdentity: 'report+encounter+difficulty',
      metricContract: 'pull-lab-comparison-v1',
      phaseModel: 'absolute-stage',
      crossDifficultyComparisonForbidden: true,
      observedMechanicDoesNotImplyFailure: true,
    },
  };
}
