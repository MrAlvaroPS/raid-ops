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
  DefensiveAuditScope,
  DefensiveAuditSnapshot,
  DefensiveDeathChain,
  DefensiveParticipant,
} from '../domain/defensive-audit.models';

const CONTRACT = 'defensive-audit-observational-v1';

function emptySnapshot(
  scope: DefensiveAuditScope,
  generatedAt: number,
  reason: string,
): DefensiveAuditSnapshot {
  return {
    status: 'empty',
    generatedAt,
    reportCode: scope.reportCode,
    encounter: null,
    population: null,
    homeRaidEligible: null,
    participants: [],
    chains: [],
    classificationStatus: 'gated',
    classificationReason: reason,
    deathCounts: { raw: 0, meaningful: 0, first: 0, linked: 0, wipeCutoff: 5 },
    observedConsumables: {
      healthstones: 0,
      potions: 0,
      availability: 'not-proven-by-wcl',
    },
    partialReasons: [],
    emptyReason: reason,
    evidence: evidence(),
  };
}

function evidence(): DefensiveAuditSnapshot['evidence'] {
  return {
    source: 'Warcraft Logs API v2',
    metricContract: 'defensive-audit-observational-v1',
    scopeIdentity: 'report+encounter+difficulty',
    preventability: 'not-assessed',
    defensiveAvailability: 'unknown',
    inventoryAvailability: 'unknown',
    causality: 'probable-temporal-association-only',
  };
}

function nullableNonNegative(value: unknown, field: string): number | null {
  const result = optionalFiniteNumber(value);
  if (result == null) return null;
  if (result < 0) throw new ApiContractError(CONTRACT, `${field} cannot be negative`);
  return result;
}

function decodeChain(
  value: unknown,
  eligibleFightIds: ReadonlySet<number>,
  windowMs: number,
): DefensiveDeathChain {
  const row = requireRecord(value, CONTRACT);
  const fightId = requirePositiveInteger(row['fightId'], 'deathChains.fightId', CONTRACT);
  if (eligibleFightIds.size && !eligibleFightIds.has(fightId))
    throw new ApiContractError(CONTRACT, 'death chain belongs to an excluded pull');
  const actorId =
    row['actorId'] == null
      ? null
      : requirePositiveInteger(row['actorId'], 'deathChains.actorId', CONTRACT);
  const deathAtMs = nullableNonNegative(row['deathAtMs'], 'deathChains.deathAtMs');
  if (deathAtMs == null)
    throw new ApiContractError(CONTRACT, 'death chain requires its report timestamp');
  const probable = optionalRecord(row['probableCause']);
  const probableDelta = probable
    ? nullableNonNegative(
        probable['occurredMsBeforeDeath'],
        'deathChains.probableCause.occurredMsBeforeDeath',
      )
    : null;
  if (probable && probableDelta == null)
    throw new ApiContractError(CONTRACT, 'probable cause requires a bounded death delta');
  if (probableDelta != null && probableDelta > windowMs)
    throw new ApiContractError(CONTRACT, 'probable cause lies outside the declared death window');
  const decodedEvidence = Array.isArray(row['evidence'])
    ? row['evidence'].map((item) => {
        const candidate = requireRecord(item, CONTRACT);
        const deltaMs = nullableNonNegative(candidate['deltaMs'], 'deathChains.evidence.deltaMs');
        if (deltaMs == null || deltaMs > windowMs)
          throw new ApiContractError(CONTRACT, 'death evidence lies outside the declared window');
        return {
          mechanicKey: optionalText(candidate['mechanicKey']),
          mechanicName:
            optionalText(candidate['mechanicName']) ??
            optionalText(candidate['reason']) ??
            'Classified mechanic evidence',
          reason: optionalText(candidate['reason']),
          occurredMsBeforeDeath: deltaMs,
          confidence: optionalText(candidate['confidence']),
        };
      })
    : [];
  const player = optionalText(row['player']);
  return {
    key: `${fightId}:${actorId ?? 'unknown'}:${deathAtMs}`,
    fightId,
    actorId,
    player,
    deathAtMs,
    fightRelativeMs: nullableNonNegative(row['fightRelativeMs'], 'deathChains.fightRelativeMs'),
    killingBlow: optionalText(row['killingBlow']),
    confidence: optionalText(row['confidence']) ?? 'unknown',
    probableCause: probable
      ? {
          mechanicKey: optionalText(probable['mechanicKey']) ?? 'unknown',
          mechanicName: optionalText(probable['mechanicName']) ?? 'Classified mechanic evidence',
          reason: optionalText(probable['reason']),
          occurredMsBeforeDeath: probableDelta!,
        }
      : null,
    evidence: decodedEvidence,
  };
}

export function decodeDefensiveAuditResponse(
  value: unknown,
  scope: DefensiveAuditScope,
): DefensiveAuditSnapshot {
  const root = requireRecord(value, CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(CONTRACT, 'response must declare ok=true');
  const generatedAt = optionalFiniteNumber(root['generatedAt']) ?? Date.now();
  const telemetry = optionalRecord(root['telemetry']);
  const rootStatus = optionalText(root['status']) ?? 'unknown';
  if (!telemetry) {
    const reason =
      rootStatus === 'waiting-for-first-combat'
        ? 'The report is waiting for its first combat.'
        : rootStatus === 'waiting-for-completed-pull'
          ? 'No completed pull exists for this exact scope.'
          : 'Observed defensive evidence is unavailable for this exact scope.';
    return emptySnapshot(scope, generatedAt, reason);
  }
  if (optionalText(telemetry['reportCode']) !== scope.reportCode)
    throw new ApiContractError(CONTRACT, 'telemetry report differs from the explicit request');

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
  const telemetryEvidence = requireRecord(telemetry['evidenceContract'], CONTRACT);
  if (
    telemetryEvidence['scopeIdentity'] !== 'encounter+difficulty' ||
    telemetryEvidence['crossDifficultyComparisonForbidden'] !== true
  )
    throw new ApiContractError(CONTRACT, 'telemetry difficulty-isolation evidence is missing');

  const telemetryPopulation = optionalRecord(telemetry['analysisPopulation']);
  const rootPopulation = optionalRecord(root['analysisPopulation']);
  const pullIntelligence = optionalRecord(telemetry['pullIntelligence']);
  const pullRows = Array.isArray(pullIntelligence?.['pulls']) ? pullIntelligence!['pulls'] : [];
  const eligibleFightIds = Array.isArray(rootPopulation?.['eligibleFightIds'])
    ? rootPopulation!['eligibleFightIds'].map((id) =>
        requirePositiveInteger(id, 'analysisPopulation.eligibleFightIds', CONTRACT),
      )
    : pullRows.map((pull) =>
        requirePositiveInteger(
          requireRecord(pull, CONTRACT)['fightId'],
          'pullIntelligence.pulls.fightId',
          CONTRACT,
        ),
      );
  if (new Set(eligibleFightIds).size !== eligibleFightIds.length)
    throw new ApiContractError(CONTRACT, 'eligible fight IDs must be unique');
  const rawPulls = nonNegativeNumber(
    rootPopulation?.['rawPulls'] ?? telemetryPopulation?.['rawPulls'],
  );
  const eligiblePulls = nonNegativeNumber(
    rootPopulation?.['eligiblePulls'] ?? telemetryPopulation?.['eligiblePulls'],
  );
  const excludedValue = rootPopulation?.['excludedPulls'] ?? telemetryPopulation?.['excludedPulls'];
  const excludedFightIds = Array.isArray(excludedValue)
    ? excludedValue.map((item) =>
        requirePositiveInteger(
          requireRecord(item, CONTRACT)['fightId'],
          'analysisPopulation.excludedPulls.fightId',
          CONTRACT,
        ),
      )
    : [];
  const excludedPulls = Array.isArray(excludedValue)
    ? excludedValue.length
    : nonNegativeNumber(excludedValue);
  if (new Set(excludedFightIds).size !== excludedFightIds.length)
    throw new ApiContractError(CONTRACT, 'excluded fight IDs must be unique');
  if (excludedFightIds.some((fightId) => eligibleFightIds.includes(fightId)))
    throw new ApiContractError(CONTRACT, 'eligible and excluded fight populations overlap');
  if (rawPulls !== eligiblePulls + excludedPulls)
    throw new ApiContractError(CONTRACT, 'analysis population does not reconcile');
  if (eligibleFightIds.length !== eligiblePulls)
    throw new ApiContractError(CONTRACT, 'eligible fight population contradicts its IDs');

  const deaths = requireRecord(telemetry['deaths'], CONTRACT);
  const rawDeaths = nonNegativeNumber(deaths['rawCount']);
  const meaningfulDeaths = nonNegativeNumber(deaths['meaningfulCount']);
  const firstDeaths = nonNegativeNumber(deaths['firstDeathCount']);
  if (meaningfulDeaths > rawDeaths || firstDeaths > meaningfulDeaths)
    throw new ApiContractError(CONTRACT, 'death populations do not reconcile');
  const wipeCutoff = nonNegativeNumber(deaths['wipeCutoff'], 5);

  const completeness = optionalRecord(root['dataCompleteness']);
  const operationalDeathStreamTruncated =
    optionalRecord(completeness?.['meaningfulDeaths'])?.['truncated'] === true;
  const bestPullEvents = optionalRecord(telemetry['bestPullEvents']);
  const telemetryDeathStreamTruncated =
    optionalRecord(bestPullEvents?.['pagesIncomplete'])?.['deaths'] === true;

  const rootEvidence = optionalRecord(root['evidenceContract']);
  const mechanics = optionalRecord(root['mechanics']);
  const deathChains = optionalRecord(root['deathChains']);
  const classificationReady = rootStatus === 'ready' && mechanics != null && deathChains != null;
  if (
    classificationReady &&
    (rootEvidence?.['scopeIdentity'] !== 'encounter+difficulty' ||
      rootEvidence?.['crossDifficultyComparisonForbidden'] !== true ||
      rootEvidence?.['observedMechanicDoesNotImplyFailure'] !== true)
  )
    throw new ApiContractError(CONTRACT, 'operational evidence separation is missing');
  const windowMs = classificationReady
    ? nonNegativeNumber(deathChains!['windowMs'], 10_000)
    : 10_000;
  if (classificationReady && windowMs <= 0)
    throw new ApiContractError(CONTRACT, 'death-chain window must be positive');
  const chains =
    classificationReady && Array.isArray(deathChains!['chains'])
      ? deathChains!['chains'].map((chain) =>
          decodeChain(chain, new Set(eligibleFightIds), windowMs),
        )
      : [];
  if (classificationReady) {
    const declaredTotal = nonNegativeNumber(deathChains!['total']);
    const declaredClassified = nonNegativeNumber(deathChains!['classified']);
    const classified = chains.filter((chain) => chain.probableCause != null).length;
    if (declaredTotal !== chains.length || declaredClassified !== classified)
      throw new ApiContractError(CONTRACT, 'death-chain totals do not reconcile');
    if (
      !operationalDeathStreamTruncated &&
      !telemetryDeathStreamTruncated &&
      declaredTotal !== meaningfulDeaths
    )
      throw new ApiContractError(
        CONTRACT,
        'complete meaningful-death streams disagree across endpoints',
      );
  }

  const useRows = optionalRecord(
    optionalRecord(telemetry['consumables'])?.['detectedUsesByPlayerName'],
  );
  const usesFor = (name: string): { healthstone: number; potion: number } => {
    const row = optionalRecord(useRows?.[name.toLowerCase()]);
    return {
      healthstone: nonNegativeNumber(row?.['healthstone']),
      potion: nonNegativeNumber(row?.['potion']),
    };
  };
  const participants: DefensiveParticipant[] = [];
  const knownActors = new Set<number>();
  for (const item of Array.isArray(telemetry['players']) ? telemetry['players'] : []) {
    const player = requireRecord(item, CONTRACT);
    const actorId = requirePositiveInteger(player['actorId'], 'players.actorId', CONTRACT);
    if (knownActors.has(actorId))
      throw new ApiContractError(CONTRACT, 'player actor IDs must be unique');
    knownActors.add(actorId);
    const name = optionalText(player['name']) ?? `Actor ${actorId}`;
    const encounterFacts = optionalRecord(player['encounter']);
    const uses = usesFor(name);
    participants.push({
      actorId,
      name,
      className: optionalText(player['className']),
      spec: optionalText(player['spec']),
      role: optionalText(player['role']),
      source: 'best-pull-roster',
      rawDeaths: nullableNonNegative(encounterFacts?.['deaths'], 'players.encounter.deaths'),
      meaningfulDeaths: nullableNonNegative(
        encounterFacts?.['meaningfulDeaths'],
        'players.encounter.meaningfulDeaths',
      ),
      firstDeaths: nullableNonNegative(
        encounterFacts?.['firstDeaths'],
        'players.encounter.firstDeaths',
      ),
      observedHealthstones: uses.healthstone,
      observedPotions: uses.potion,
      linkedChains: chains.filter(
        (chain) => chain.actorId === actorId && chain.probableCause != null,
      ).length,
    });
  }
  for (const chain of chains) {
    if (chain.actorId == null || knownActors.has(chain.actorId)) continue;
    knownActors.add(chain.actorId);
    const name = chain.player ?? `Actor ${chain.actorId}`;
    const uses = usesFor(name);
    const actorChains = chains.filter((candidate) => candidate.actorId === chain.actorId);
    participants.push({
      actorId: chain.actorId,
      name,
      className: null,
      spec: null,
      role: null,
      source: 'death-chain-actor',
      rawDeaths: null,
      meaningfulDeaths: actorChains.length,
      firstDeaths: null,
      observedHealthstones: uses.healthstone,
      observedPotions: uses.potion,
      linkedChains: actorChains.filter((candidate) => candidate.probableCause != null).length,
    });
  }
  participants.sort((a, b) => a.name.localeCompare(b.name));
  const allUseRows = Object.values(useRows ?? {})
    .map(optionalRecord)
    .filter(Boolean);
  const healthstones = allUseRows.reduce(
    (sum, row) => sum + nonNegativeNumber(row?.['healthstone']),
    0,
  );
  const potions = allUseRows.reduce((sum, row) => sum + nonNegativeNumber(row?.['potion']), 0);

  const partialReasons: string[] = [];
  if (!classificationReady)
    partialReasons.push(
      'Mechanic classification is gated until the exact operational encounter reference has passed rehearsal.',
    );
  if (telemetryDeathStreamTruncated || operationalDeathStreamTruncated)
    partialReasons.push('At least one death evidence stream is truncated.');
  if (participants.length)
    partialReasons.push(
      'Participant coverage starts from the selected best-pull roster; death-chain-only actors are retained when available.',
    );
  if (participants.some((participant) => participant.source === 'death-chain-actor'))
    partialReasons.push(
      'Some death actors are outside the selected best-pull roster and therefore have partial profile facts.',
    );

  const raidKnowledge = optionalRecord(root['raidKnowledge']);
  return {
    status: 'ready',
    generatedAt,
    reportCode: scope.reportCode,
    encounter: {
      id: encounterId,
      name: optionalText(encounterRow['name']),
      difficulty,
      difficultyName: optionalText(encounterRow['difficultyName']) ?? `Difficulty ${difficulty}`,
      scopeKey,
    },
    population: { rawPulls, eligiblePulls, excludedPulls, eligibleFightIds },
    homeRaidEligible:
      typeof raidKnowledge?.['homeRaidEligible'] === 'boolean'
        ? raidKnowledge['homeRaidEligible']
        : null,
    participants,
    chains,
    classificationStatus: classificationReady ? 'ready' : 'gated',
    classificationReason: classificationReady
      ? null
      : 'Observed deaths and consumable casts remain available, but probable mechanic links are gated.',
    deathCounts: {
      raw: rawDeaths,
      meaningful: meaningfulDeaths,
      first: firstDeaths,
      linked: chains.filter((chain) => chain.probableCause != null).length,
      wipeCutoff,
    },
    observedConsumables: {
      healthstones,
      potions,
      availability: 'not-proven-by-wcl',
    },
    partialReasons,
    emptyReason: null,
    evidence: evidence(),
  };
}
