import {
  ApiContractError,
  nonNegativeNumber as nonNegative,
  optionalFiniteNumber as finite,
  optionalRecord,
  optionalText as text,
  requirePositiveInteger,
  requireRecord,
} from '../../../core/http/api-contract';
import { CompositionPlayer, CompositionSnapshot, GearItem, ProfileCoverage, TalentItem } from '../domain/composition.models';

const CONTRACT = 'wcl-composition-telemetry-v1';
function safeWowheadUrl(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && /(^|\.)wowhead\.com$/i.test(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function decodeGear(value: unknown): GearItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const row = optionalRecord(item);
    if (!row) return [];
    const id = finite(row['id']);
    const name = text(row['name']);
    if ((!id || id <= 0) && !name) return [];
    return [{
      id: id && id > 0 ? id : null,
      name,
      itemLevel: finite(row['itemLevel']),
      slot: text(row['slot']),
      quality: finite(row['quality']),
    }];
  });
}

function decodeTalents(value: unknown): TalentItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const row = optionalRecord(item);
    if (!row) return [];
    const result = {
      id: finite(row['entryId']),
      spellId: finite(row['spellId']),
      name: text(row['name']),
      points: finite(row['rank']),
    };
    return result.id || result.spellId || result.name ? [result] : [];
  });
}

function decodePlayer(value: unknown, index: number): CompositionPlayer {
  const row = requireRecord(value, CONTRACT);
  const role = text(row['role']);
  if (role != null && !['TANK', 'HEAL', 'DPS'].includes(role)) {
    throw new ApiContractError(CONTRACT, `players[${index}].role is unsupported`);
  }
  const actorId = requirePositiveInteger(row['actorId'], `players[${index}].actorId`, CONTRACT);
  const name = text(row['name']);
  if (!name) throw new ApiContractError(CONTRACT, `players[${index}].name is required`);
  const bestPull = optionalRecord(row['bestPull']) ?? {};
  const character = optionalRecord(row['character']) ?? {};
  const reliability = optionalRecord(row['reliability']) ?? {};
  return {
    actorId,
    name,
    className: text(row['className']),
    spec: text(row['spec']),
    itemLevel: finite(row['itemLevel']),
    role: role as CompositionPlayer['role'],
    server: text(row['server']),
    bestPull: { dps: nonNegative(bestPull['dps']), hps: nonNegative(bestPull['hps']) },
    character: {
      gear: decodeGear(character['gear']),
      gearCount: nonNegative(character['gearCount']),
      talents: decodeTalents(character['talents']),
      talentCount: nonNegative(character['talentCount']),
      talentImportCode: text(character['talentImportCode']),
      talentWowheadUrl: safeWowheadUrl(character['talentWowheadUrl']),
      combatantInfoSource: text(character['combatantInfoSource']),
    },
    reliability: {
      value: finite(reliability['value']),
      status: text(reliability['status']) ?? 'unknown',
      confidence: text(reliability['confidence']) ?? 'unknown',
      reason: text(reliability['reason']),
    },
  };
}

function decodeCoverage(value: unknown): ProfileCoverage | null {
  const row = optionalRecord(value);
  if (!row) return null;
  return {
    roster: nonNegative(row['roster']),
    withGear: nonNegative(row['withGear']),
    withTalents: nonNegative(row['withTalents']),
    gearPct: Math.min(100, nonNegative(row['gearPct'])),
    talentPct: Math.min(100, nonNegative(row['talentPct'])),
  };
}

export function decodeCompositionTelemetry(value: unknown): CompositionSnapshot {
  const root = requireRecord(value, CONTRACT);
  if (root['ok'] !== true) throw new ApiContractError(CONTRACT, 'response must declare ok=true');
  const reportCode = text(root['reportCode']);
  if (!reportCode) throw new ApiContractError(CONTRACT, 'reportCode is required');
  const encounterRow = optionalRecord(root['encounter']);
  const players = Array.isArray(root['players']) ? root['players'].map(decodePlayer) : [];

  if (root['telemetry'] === null || !encounterRow) {
    return {
      status: 'empty', generatedAt: finite(root['generatedAt']) ?? Date.now(), reportCode,
      encounter: encounterRow ? {
        id: requirePositiveInteger(encounterRow['id'], 'encounter.id', CONTRACT),
        name: text(encounterRow['name']), difficulty: requirePositiveInteger(encounterRow['difficulty'], 'encounter.difficulty', CONTRACT),
        difficultyName: text(encounterRow['difficultyName']) ?? 'Unknown', scopeKey: text(encounterRow['scopeKey']) ?? '', pulls: nonNegative(encounterRow['pulls']),
      } : null,
      players: [], coverage: null, profileSource: null, partialReasons: [],
      emptyReason: text(root['reason']) ?? 'No completed pull is available for this exact scope.', evidence: null,
    };
  }

  const difficulty = requirePositiveInteger(encounterRow['difficulty'], 'encounter.difficulty', CONTRACT);
  const scopeKey = text(encounterRow['scopeKey']);
  if (!scopeKey || scopeKey !== `${Number(encounterRow['id'])}:d${difficulty}`) {
    throw new ApiContractError(CONTRACT, 'encounter.scopeKey does not match encounter+difficulty');
  }
  const evidenceContract = requireRecord(root['evidenceContract'], CONTRACT);
  if (evidenceContract['scopeIdentity'] !== 'encounter+difficulty' || evidenceContract['crossDifficultyComparisonForbidden'] !== true) {
    throw new ApiContractError(CONTRACT, 'difficulty-isolation evidence contract is missing');
  }
  const errors = optionalRecord(root['errors']);
  const partialReasons = errors ? Object.entries(errors).filter(([, message]) => Boolean(message)).map(([area]) => `${area} unavailable`) : [];
  const profile = optionalRecord(root['playerProfiles']);
  const evidence = optionalRecord(root['evidence']);
  return {
    status: players.length ? 'ready' : 'empty',
    generatedAt: finite(root['generatedAt']) ?? Date.now(),
    reportCode,
    encounter: {
      id: requirePositiveInteger(encounterRow['id'], 'encounter.id', CONTRACT), name: text(encounterRow['name']), difficulty,
      difficultyName: text(encounterRow['difficultyName']) ?? `Difficulty ${difficulty}`, scopeKey, pulls: nonNegative(encounterRow['pulls']),
    },
    players,
    coverage: decodeCoverage(profile?.['coverage']),
    profileSource: text(profile?.['source']),
    partialReasons,
    emptyReason: players.length ? null : 'The scope has no WCL actors in its selected best pull.',
    evidence: {
      source: text(evidence?.['source']) ?? 'Warcraft Logs API v2',
      scopeIdentity: 'encounter+difficulty',
      crossDifficultyComparisonForbidden: true,
    },
  };
}
