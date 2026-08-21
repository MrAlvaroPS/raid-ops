import {
  ApiContractError,
  optionalFiniteNumber,
  optionalRecord,
  optionalText,
  requirePositiveInteger,
  requireRecord,
} from '../../../core/http/api-contract';
import {
  CommandCenterBlocker,
  CommandCenterPull,
  CommandCenterScope,
  CommandCenterSnapshot,
} from '../domain/command-center.models';
import { compareLatestPulls } from '../domain/command-center.rules';

const CONTRACT = 'command-center-operational-overview-v1';

function nonNegative(value: unknown, field: string): number {
  const result = optionalFiniteNumber(value);
  if (result == null || result < 0)
    throw new ApiContractError(CONTRACT, `${field} must be a non-negative number`);
  return result;
}

function nullableNonNegative(value: unknown, field: string): number | null {
  if (value == null) return null;
  return nonNegative(value, field);
}

function percentage(value: unknown, field: string): number | null {
  const result = nullableNonNegative(value, field);
  if (result != null && result > 100)
    throw new ApiContractError(CONTRACT, `${field} cannot exceed 100`);
  return result;
}

function evidence(): CommandCenterSnapshot['evidence'] {
  return {
    source: 'Warcraft Logs API v2',
    metricContract: 'command-center-operational-overview-v1',
    scopeIdentity: 'report+encounter+difficulty',
    refresh: 'manual-snapshot',
    killReadiness: 'not-assessed',
    causality: 'evidence-ranked-association-only',
    crossDifficultyComparisonForbidden: true,
  };
}

function decodeRootEncounter(
  value: unknown,
  scope: CommandCenterScope,
): CommandCenterSnapshot['encounter'] {
  const row = optionalRecord(value);
  if (!row) return null;
  const id = requirePositiveInteger(row['id'], 'encounter.id', CONTRACT);
  const difficulty = requirePositiveInteger(row['difficulty'], 'encounter.difficulty', CONTRACT);
  const scopeKey = optionalText(row['scopeKey']) ?? `${id}:d${difficulty}`;
  if (
    id !== scope.encounterId ||
    difficulty !== scope.difficulty ||
    scopeKey !== `${id}:d${difficulty}`
  )
    throw new ApiContractError(CONTRACT, 'response scope differs from the explicit request');
  return {
    id,
    name: optionalText(row['name']),
    difficulty,
    difficultyName: optionalText(row['difficultyName']) ?? `Difficulty ${difficulty}`,
    scopeKey,
    inProgress: typeof row['inProgress'] === 'boolean' ? row['inProgress'] : null,
  };
}

function decodePull(value: unknown): CommandCenterPull {
  const row = requireRecord(value, CONTRACT);
  const fightPercentage = percentage(row['fightPercentage'], 'pull.fightPercentage');
  const durationMs = nonNegative(row['durationMs'], 'pull.durationMs');
  if (durationMs <= 0) throw new ApiContractError(CONTRACT, 'pull.durationMs must be positive');
  const kill = row['kill'] === true;
  if (kill && fightPercentage != null && fightPercentage !== 0)
    throw new ApiContractError(CONTRACT, 'a killed pull cannot retain boss health');
  return {
    fightId: requirePositiveInteger(row['fightId'], 'pull.fightId', CONTRACT),
    pullNumber: requirePositiveInteger(row['pullNumber'], 'pull.pullNumber', CONTRACT),
    kill,
    fightPercentage,
    durationMs,
    stageCount: requirePositiveInteger(row['stageCount'], 'pull.stageCount', CONTRACT),
    meaningfulDeaths: nonNegative(row['meaningfulDeaths'], 'pull.meaningfulDeaths'),
    raidDps: nullableNonNegative(row['raidDps'], 'pull.raidDps'),
    rosterFingerprint: typeof row['rosterFingerprint'] === 'string' ? row['rosterFingerprint'] : '',
  };
}

function decodeBlocker(
  value: unknown,
  eligibleFightIds: ReadonlySet<number>,
  meaningfulDeaths: number,
): { blocker: CommandCenterBlocker | null; status: 'ready' | 'insufficient-data' } {
  const wrapper = requireRecord(value, CONTRACT);
  const status = optionalText(wrapper['status']);
  const row = optionalRecord(wrapper['blocker']);
  if (status === 'insufficient-data' && !row) return { blocker: null, status: 'insufficient-data' };
  if (status !== 'derived' || !row)
    throw new ApiContractError(CONTRACT, 'blocker status and payload contradict each other');
  const confidence = optionalText(wrapper['confidence']);
  if (confidence !== 'high' && confidence !== 'medium' && confidence !== 'low')
    throw new ApiContractError(CONTRACT, 'blocker confidence is invalid');
  const fights = Array.isArray(row['fights'])
    ? row['fights'].map((fightId) => requirePositiveInteger(fightId, 'blocker.fights', CONTRACT))
    : [];
  if (
    new Set(fights).size !== fights.length ||
    fights.some((fightId) => !eligibleFightIds.has(fightId))
  )
    throw new ApiContractError(CONTRACT, 'blocker fights contradict the eligible population');
  const failedOccurrences = nonNegative(row['failedOccurrences'], 'blocker.failedOccurrences');
  const recentFailures = nonNegative(row['recentFailures'], 'blocker.recentFailures');
  const opportunities = nonNegative(row['opportunities'], 'blocker.opportunities');
  const linkedDeaths = nonNegative(row['linkedDeaths'], 'blocker.linkedDeaths');
  const recurrence = nonNegative(row['recurrence'], 'blocker.recurrence');
  const denominatorStatus = optionalText(row['denominatorStatus']) ?? 'unknown';
  const failureRate = percentage(
    nullableNonNegative(row['failureRate'], 'blocker.failureRate') == null
      ? null
      : Number(row['failureRate']) * 100,
    'blocker.failureRate',
  );
  if (
    recurrence !== fights.length ||
    recentFailures > failedOccurrences ||
    (denominatorStatus === 'normalized' && failedOccurrences > opportunities) ||
    linkedDeaths > meaningfulDeaths
  )
    throw new ApiContractError(CONTRACT, 'blocker populations do not reconcile');
  return {
    status: 'ready',
    blocker: {
      key: optionalText(row['key']) ?? 'unknown',
      name: optionalText(row['name']) ?? 'Classified mechanic',
      confidence,
      failedOccurrences,
      opportunities,
      failureRate: failureRate == null ? null : failureRate / 100,
      recentFailures,
      affectedPulls: fights.length,
      linkedDeaths,
      denominatorStatus,
      scoringModel:
        optionalText(wrapper['scoringModel']) ?? 'Evidence-ranked operational blocker model.',
    },
  };
}

function emptySnapshot(
  scope: CommandCenterScope,
  generatedAt: number,
  encounter: CommandCenterSnapshot['encounter'],
  homeRaidEligible: boolean | null,
  rootStatus: string,
): CommandCenterSnapshot {
  const active = encounter?.inProgress === true;
  return {
    status: 'empty',
    generatedAt,
    reportCode: scope.reportCode,
    encounter,
    homeRaidEligible,
    population: encounter ? { rawPulls: 0, eligiblePulls: 0, excludedPulls: 0 } : null,
    pulls: [],
    bestPull: null,
    latestPull: null,
    comparison: null,
    deathCounts: null,
    blocker: null,
    classificationStatus: 'gated',
    classificationReason: 'Operational classification requires a completed analytical pull.',
    partialReasons: active
      ? ['An active pull is visible, but analytics remain on completed pulls only.']
      : [],
    emptyReason:
      rootStatus === 'waiting-for-first-combat'
        ? 'The report is waiting for its first combat in this exact scope.'
        : active
          ? 'A pull is active. Command Center will not treat it as completed evidence.'
          : 'No completed analytical pull exists for this exact scope.',
    rulePack: null,
    evidence: evidence(),
  };
}

export function decodeCommandCenterResponse(
  value: unknown,
  scope: CommandCenterScope,
): CommandCenterSnapshot {
  const root = requireRecord(value, CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(CONTRACT, 'response must declare ok=true');
  const generatedAt = optionalFiniteNumber(root['generatedAt']);
  if (generatedAt == null || generatedAt <= 0)
    throw new ApiContractError(CONTRACT, 'generatedAt must be a positive timestamp');
  const report = optionalRecord(root['report']);
  if (report && optionalText(report['code']) !== scope.reportCode)
    throw new ApiContractError(CONTRACT, 'report code differs from the explicit request');
  const rootEncounter = decodeRootEncounter(root['encounter'], scope);
  const raidKnowledge = optionalRecord(root['raidKnowledge']);
  const homeRaidEligible =
    typeof raidKnowledge?.['homeRaidEligible'] === 'boolean'
      ? raidKnowledge['homeRaidEligible']
      : null;
  const rootStatus = optionalText(root['status']) ?? 'unknown';
  const telemetry = optionalRecord(root['telemetry']);
  if (!telemetry)
    return emptySnapshot(scope, generatedAt, rootEncounter, homeRaidEligible, rootStatus);

  if (optionalText(telemetry['reportCode']) !== scope.reportCode)
    throw new ApiContractError(CONTRACT, 'telemetry report differs from the explicit request');
  const telemetryEncounter = decodeRootEncounter(telemetry['encounter'], scope);
  if (!telemetryEncounter)
    throw new ApiContractError(CONTRACT, 'completed telemetry requires encounter identity');
  const encounter = {
    ...telemetryEncounter,
    inProgress: rootEncounter?.inProgress ?? telemetryEncounter.inProgress,
  };
  const telemetryEvidence = requireRecord(telemetry['evidenceContract'], CONTRACT);
  if (
    telemetryEvidence['scopeIdentity'] !== 'encounter+difficulty' ||
    telemetryEvidence['crossDifficultyComparisonForbidden'] !== true
  )
    throw new ApiContractError(CONTRACT, 'telemetry difficulty-isolation evidence is missing');

  const intelligence = requireRecord(telemetry['pullIntelligence'], CONTRACT);
  const pulls = Array.isArray(intelligence['pulls']) ? intelligence['pulls'].map(decodePull) : [];
  const fightIds = pulls.map((pull) => pull.fightId);
  const pullNumbers = pulls.map((pull) => pull.pullNumber);
  if (
    new Set(fightIds).size !== pulls.length ||
    new Set(pullNumbers).size !== pulls.length ||
    pullNumbers.some((pullNumber, index) => index > 0 && pullNumber <= pullNumbers[index - 1])
  )
    throw new ApiContractError(CONTRACT, 'eligible pulls must have unique chronological identity');

  const population =
    optionalRecord(root['analysisPopulation']) ??
    optionalRecord(intelligence['analysisPopulation']);
  if (!population)
    throw new ApiContractError(CONTRACT, 'analysis population is missing from the snapshot');
  const rawPulls = nonNegative(population['rawPulls'], 'analysisPopulation.rawPulls');
  const eligiblePulls = nonNegative(
    population['eligiblePulls'],
    'analysisPopulation.eligiblePulls',
  );
  const excludedRows = Array.isArray(population['excludedPulls'])
    ? population['excludedPulls']
    : [];
  const eligibleIds = Array.isArray(population['eligibleFightIds'])
    ? population['eligibleFightIds'].map((id) =>
        requirePositiveInteger(id, 'analysisPopulation.eligibleFightIds', CONTRACT),
      )
    : [];
  const excludedIds = excludedRows.map((item) =>
    requirePositiveInteger(
      requireRecord(item, CONTRACT)['fightId'],
      'analysisPopulation.excludedPulls.fightId',
      CONTRACT,
    ),
  );
  if (
    rawPulls !== eligiblePulls + excludedRows.length ||
    eligiblePulls !== pulls.length ||
    new Set(eligibleIds).size !== eligibleIds.length ||
    eligibleIds.length !== pulls.length ||
    eligibleIds.some((id) => !fightIds.includes(id)) ||
    excludedIds.some((id) => eligibleIds.includes(id))
  )
    throw new ApiContractError(CONTRACT, 'analysis population does not reconcile');

  const latestRow = optionalRecord(intelligence['latest']);
  const previousRow = optionalRecord(intelligence['previous']);
  const bestRow = optionalRecord(intelligence['best']);
  const latestPull = latestRow ? decodePull(latestRow) : (pulls.at(-1) ?? null);
  const previousPull = previousRow
    ? decodePull(previousRow)
    : pulls.length > 1
      ? pulls.at(-2)!
      : null;
  const bestPull = bestRow ? decodePull(bestRow) : null;
  const contains = (pull: CommandCenterPull | null) =>
    !pull || pulls.some((candidate) => candidate.fightId === pull.fightId);
  if (!contains(latestPull) || !contains(previousPull) || !contains(bestPull))
    throw new ApiContractError(CONTRACT, 'pull intelligence references an ineligible pull');
  if (pulls.length && (!latestPull || !bestPull))
    throw new ApiContractError(CONTRACT, 'pull intelligence omits latest or best pull');

  const deaths = requireRecord(telemetry['deaths'], CONTRACT);
  const rawDeaths = nonNegative(deaths['rawCount'], 'deaths.rawCount');
  const meaningfulDeaths = nonNegative(deaths['meaningfulCount'], 'deaths.meaningfulCount');
  const firstDeaths = nonNegative(deaths['firstDeathCount'], 'deaths.firstDeathCount');
  if (meaningfulDeaths > rawDeaths || firstDeaths > meaningfulDeaths)
    throw new ApiContractError(CONTRACT, 'death populations do not reconcile');

  let blocker: CommandCenterBlocker | null = null;
  let classificationStatus: CommandCenterSnapshot['classificationStatus'] = 'gated';
  let classificationReason: string | null =
    'Operational mechanic classification is gated until its exact-scope reference is ready.';
  if (rootStatus === 'ready') {
    const rootEvidence = requireRecord(root['evidenceContract'], CONTRACT);
    if (
      rootEvidence['scopeIdentity'] !== 'encounter+difficulty' ||
      rootEvidence['crossDifficultyComparisonForbidden'] !== true ||
      rootEvidence['observedMechanicDoesNotImplyFailure'] !== true ||
      rootEvidence['observedCountsAreOccurrenceNormalized'] !== true
    )
      throw new ApiContractError(CONTRACT, 'operational evidence separation is missing');
    const decoded = decodeBlocker(root['blocker'], new Set(eligibleIds), meaningfulDeaths);
    blocker = decoded.blocker;
    classificationStatus = decoded.status;
    classificationReason = blocker
      ? null
      : 'The reference is ready, but no evidence-ranked blocker is established.';
  }

  const partialReasons: string[] = [];
  const completeness = optionalRecord(root['dataCompleteness']);
  if (
    completeness &&
    Object.entries(completeness).some(([, row]) => optionalRecord(row)?.['truncated'] === true)
  )
    partialReasons.push('At least one operational evidence stream is truncated.');
  if (encounter.inProgress)
    partialReasons.push(
      'An active pull is in progress; every metric below remains the last completed analytical snapshot.',
    );
  if (homeRaidEligible === false)
    partialReasons.push(
      'This is an external evaluation. Its execution evidence must never enter HOME history.',
    );
  if (classificationStatus === 'gated')
    partialReasons.push(
      'Safe pull telemetry is available, but mechanic classification is reference-gated.',
    );
  if (classificationStatus === 'gated' && encounter.inProgress == null)
    partialReasons.push(
      'Open-pull status is unavailable in the rehearsal-gated response; no LIVE state is inferred.',
    );

  const rulePack = optionalRecord(root['rulePack']);
  return {
    status: pulls.length ? 'ready' : 'empty',
    generatedAt,
    reportCode: scope.reportCode,
    encounter,
    homeRaidEligible,
    population: { rawPulls, eligiblePulls, excludedPulls: excludedRows.length },
    pulls,
    bestPull,
    latestPull,
    comparison: compareLatestPulls(latestPull, previousPull),
    deathCounts: { raw: rawDeaths, meaningful: meaningfulDeaths, first: firstDeaths },
    blocker,
    classificationStatus,
    classificationReason,
    partialReasons,
    emptyReason: pulls.length ? null : 'No completed analytical pull exists for this exact scope.',
    rulePack: rulePack
      ? {
          slug: optionalText(rulePack['slug']),
          version: optionalText(rulePack['version']),
          source: optionalText(rulePack['source']),
        }
      : null,
    evidence: evidence(),
  };
}
