import {
  ApiContractError,
  optionalFiniteNumber as finite,
  optionalRecord,
  optionalText as text,
  requirePositiveInteger,
  requireRecord,
} from '../../../core/http/api-contract';
import {
  PlayerAttendance,
  PlayerRole,
  ReliabilityComponent,
  ReliabilityDimension,
  ReliabilityProfile,
} from '../domain/players.models';

const TELEMETRY_CONTRACT = 'wcl-players-telemetry-v1';
const INTELLIGENCE_CONTRACT = 'wcl-players-intelligence-v1';
const HISTORY_CONTRACT = 'home-player-attendance-v1';
const DIMENSIONS: readonly ReliabilityDimension[] = [
  'mechanics',
  'survival',
  'defensives',
  'duties',
];

const nonNegative = (value: unknown): number | null => {
  const result = finite(value);
  return result != null && result >= 0 ? result : null;
};
const textArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter((item): item is string => item != null) : [];
const serverName = (value: unknown): string | null => {
  const direct = text(value);
  if (direct) return direct;
  const row = optionalRecord(value);
  return text(row?.['slug']) ?? text(row?.['name']);
};

export interface PlayersTelemetryPlayerDto {
  readonly actorId: number;
  readonly name: string;
  readonly className: string | null;
  readonly spec: string | null;
  readonly role: PlayerRole;
  readonly server: string | null;
  readonly dps: number;
  readonly hps: number;
  readonly deaths: number;
  readonly meaningfulDeaths: number;
  readonly firstDeaths: number;
  readonly interrupts: number;
  readonly dispels: number;
}

export interface PlayersTelemetryDto {
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: {
    readonly id: number;
    readonly name: string | null;
    readonly difficulty: number;
    readonly difficultyName: string;
    readonly scopeKey: string;
    readonly eligiblePulls: number;
  } | null;
  readonly players: readonly PlayersTelemetryPlayerDto[];
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
}

export interface PlayerMatrixDto {
  readonly actorId: number;
  readonly name: string;
  readonly failures: number;
  readonly recentFailures: number;
  readonly linkedDeaths: number;
  readonly mechanics: Readonly<Record<string, number>>;
}

export interface PlayersIntelligenceDto {
  readonly generatedAt: number;
  readonly status: string;
  readonly encounter: {
    readonly id: number;
    readonly difficulty: number;
    readonly scopeKey: string;
  } | null;
  readonly homeRaidEligible: boolean | null;
  readonly reliabilityModelVersion: string | null;
  readonly reliabilityPolicy: string | null;
  readonly profiles: readonly ReliabilityProfile[];
  readonly matrix: readonly PlayerMatrixDto[];
}

export interface PlayersHistoryDto {
  readonly encounter: {
    readonly id: number;
    readonly difficulty: number;
    readonly scopeKey: string;
  } | null;
  readonly rows: readonly PlayerAttendance[];
  readonly semantics: string | null;
  readonly networkExecuted: false;
}

function decodeRole(value: unknown, contract: string): PlayerRole {
  const role = text(value);
  if (role == null) return null;
  if (!['TANK', 'HEAL', 'DPS'].includes(role))
    throw new ApiContractError(contract, `unsupported player role ${role}`);
  return role as Exclude<PlayerRole, null>;
}

export function decodePlayersTelemetry(value: unknown): PlayersTelemetryDto {
  const root = requireRecord(value, TELEMETRY_CONTRACT);
  if (root['ok'] !== true)
    throw new ApiContractError(TELEMETRY_CONTRACT, 'response must declare ok=true');
  const reportCode = text(root['reportCode']);
  if (!reportCode) throw new ApiContractError(TELEMETRY_CONTRACT, 'reportCode is required');
  const encounterRow = optionalRecord(root['encounter']);
  const telemetryMissing = root['telemetry'] === null;
  const encounter = encounterRow
    ? (() => {
        const id = requirePositiveInteger(encounterRow['id'], 'encounter.id', TELEMETRY_CONTRACT);
        const difficulty = requirePositiveInteger(
          encounterRow['difficulty'],
          'encounter.difficulty',
          TELEMETRY_CONTRACT,
        );
        const scopeKey = text(encounterRow['scopeKey']) ?? `${id}:d${difficulty}`;
        if (scopeKey !== `${id}:d${difficulty}`)
          throw new ApiContractError(
            TELEMETRY_CONTRACT,
            'encounter.scopeKey contradicts encounter+difficulty',
          );
        return {
          id,
          name: text(encounterRow['name']),
          difficulty,
          difficultyName: text(encounterRow['difficultyName']) ?? `Difficulty ${difficulty}`,
          scopeKey,
          eligiblePulls: nonNegative(encounterRow['pulls']) ?? 0,
        };
      })()
    : null;
  const players =
    telemetryMissing || !Array.isArray(root['players'])
      ? []
      : root['players'].map((value, index) => {
          const row = requireRecord(value, TELEMETRY_CONTRACT);
          const actorId = requirePositiveInteger(
            row['actorId'],
            `players[${index}].actorId`,
            TELEMETRY_CONTRACT,
          );
          const name = text(row['name']);
          if (!name)
            throw new ApiContractError(TELEMETRY_CONTRACT, `players[${index}].name is required`);
          const best = optionalRecord(row['bestPull']) ?? {};
          const facts = optionalRecord(row['encounter']) ?? {};
          return {
            actorId,
            name,
            className: text(row['className']),
            spec: text(row['spec']),
            role: decodeRole(row['role'], TELEMETRY_CONTRACT),
            server: serverName(row['server']),
            dps: nonNegative(best['dps']) ?? 0,
            hps: nonNegative(best['hps']) ?? 0,
            deaths: nonNegative(facts['deaths']) ?? 0,
            meaningfulDeaths: nonNegative(facts['meaningfulDeaths']) ?? 0,
            firstDeaths: nonNegative(facts['firstDeaths']) ?? 0,
            interrupts: nonNegative(facts['interrupts']) ?? 0,
            dispels: nonNegative(facts['dispels']) ?? 0,
          };
        });
  const evidenceContract = optionalRecord(root['evidenceContract']);
  if (
    encounter &&
    (evidenceContract?.['scopeIdentity'] !== 'encounter+difficulty' ||
      evidenceContract?.['crossDifficultyComparisonForbidden'] !== true)
  ) {
    throw new ApiContractError(
      TELEMETRY_CONTRACT,
      'difficulty-isolation evidence contract is missing',
    );
  }
  const errors = optionalRecord(root['errors']);
  return {
    generatedAt: finite(root['generatedAt']) ?? Date.now(),
    reportCode,
    encounter,
    players,
    partialReasons: errors
      ? Object.entries(errors)
          .filter(([, message]) => Boolean(message))
          .map(([area]) => `${area} telemetry unavailable`)
      : [],
    emptyReason: telemetryMissing
      ? (text(root['reason']) ?? 'No completed pull is available for this exact scope.')
      : players.length
        ? null
        : 'The selected best pull contains no player actors.',
  };
}

function decodeComponent(value: unknown, dimension: ReliabilityDimension): ReliabilityComponent {
  const row = optionalRecord(value) ?? {};
  const status = text(row['status']) === 'scored' ? 'scored' : 'pending';
  const sample = optionalRecord(row['sample']) ?? {};
  const componentValue = finite(row['value']);
  if (status === 'pending' && componentValue != null)
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `${dimension} is pending but has a public value`,
    );
  return {
    dimension,
    status,
    value: componentValue,
    why: text(row['why']),
    opportunityCount: nonNegative(sample['opportunityCount']) ?? 0,
    failureCount: nonNegative(sample['failures']) ?? 0,
  };
}

function decodeProfile(value: unknown, index: number): ReliabilityProfile {
  const row = requireRecord(value, INTELLIGENCE_CONTRACT);
  const identity = requireRecord(row['identity'], INTELLIGENCE_CONTRACT);
  const context = requireRecord(row['context'], INTELLIGENCE_CONTRACT);
  const participation = optionalRecord(row['participation']) ?? {};
  const publication = optionalRecord(row['publication']) ?? {};
  const confidence = optionalRecord(row['confidence']) ?? {};
  const explanation = optionalRecord(row['explanation']) ?? {};
  const integrity = optionalRecord(row['dataIntegrity']) ?? {};
  const componentsRow = optionalRecord(row['components']) ?? {};
  const status = text(row['status']);
  if (!status || !['published', 'shadow-pending', 'data-error'].includes(status))
    throw new ApiContractError(INTELLIGENCE_CONTRACT, `profiles[${index}].status is unsupported`);
  const valueNumber = finite(row['value']);
  const publishable = publication['publishable'] === true;
  if ((status === 'published') !== publishable)
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `profiles[${index}] publication status contradicts publication gate`,
    );
  if (status === 'published' && valueNumber == null)
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `profiles[${index}] published value is missing`,
    );
  if (status !== 'published' && valueNumber != null)
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `profiles[${index}] exposes a value before publication`,
    );
  const identityStatus = text(identity['status']);
  if (
    !identityStatus ||
    !['canonical', 'provisional-name-realm', 'report-scoped'].includes(identityStatus)
  )
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `profiles[${index}].identity.status is unsupported`,
    );
  const actorId = requirePositiveInteger(
    identity['actorId'],
    `profiles[${index}].identity.actorId`,
    INTELLIGENCE_CONTRACT,
  );
  const reportCode = text(context['reportCode']);
  const encounterId = requirePositiveInteger(
    context['encounterId'],
    `profiles[${index}].context.encounterId`,
    INTELLIGENCE_CONTRACT,
  );
  const difficulty = requirePositiveInteger(
    context['difficulty'],
    `profiles[${index}].context.difficulty`,
    INTELLIGENCE_CONTRACT,
  );
  const modelVersion = text(row['modelVersion']);
  const identityKey = text(identity['key']);
  if (!modelVersion || !identityKey || !reportCode)
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      `profiles[${index}] model, scope and identity are required`,
    );
  const componentPairs = DIMENSIONS.map(
    (dimension) => [dimension, decodeComponent(componentsRow[dimension], dimension)] as const,
  );
  return {
    modelVersion,
    identityKey,
    identityStatus: identityStatus as ReliabilityProfile['identityStatus'],
    actorId,
    reportCode,
    encounterId,
    difficulty,
    partition: finite(context['partition']),
    status: status as ReliabilityProfile['status'],
    value: valueNumber,
    confidence: text(confidence['level']) ?? 'unknown',
    pullsAttended: nonNegative(participation['pullsAttended']) ?? 0,
    nights: nonNegative(context['nights']) ?? 0,
    components: Object.fromEntries(componentPairs) as unknown as ReliabilityProfile['components'],
    publicationReasons: textArray(publication['reasons']),
    explanation:
      text(explanation['summary']) ?? 'Reliability evidence is unavailable for explanation.',
    observedNotScored: textArray(explanation['observedNotScored']),
    dataIntegrityErrors: textArray(integrity['errors']),
  };
}

function decodeMechanics(value: unknown): Record<string, number> {
  const row = optionalRecord(value) ?? {};
  return Object.fromEntries(
    Object.entries(row).flatMap(([key, count]) => {
      const number = nonNegative(count);
      return number == null ? [] : [[key, number]];
    }),
  );
}

export function decodePlayersIntelligence(value: unknown): PlayersIntelligenceDto {
  const root = requireRecord(value, INTELLIGENCE_CONTRACT);
  if (root['ok'] !== true)
    throw new ApiContractError(INTELLIGENCE_CONTRACT, 'response must declare ok=true');
  const encounterRow = optionalRecord(root['encounter']);
  const encounter = encounterRow
    ? (() => {
        const id = requirePositiveInteger(
          encounterRow['id'],
          'encounter.id',
          INTELLIGENCE_CONTRACT,
        );
        const difficulty = requirePositiveInteger(
          encounterRow['difficulty'],
          'encounter.difficulty',
          INTELLIGENCE_CONTRACT,
        );
        const scopeKey = text(encounterRow['scopeKey']) ?? `${id}:d${difficulty}`;
        if (scopeKey !== `${id}:d${difficulty}`)
          throw new ApiContractError(
            INTELLIGENCE_CONTRACT,
            'encounter.scopeKey contradicts encounter+difficulty',
          );
        return { id, difficulty, scopeKey };
      })()
    : null;
  const evidence = optionalRecord(root['evidenceContract']);
  if (
    encounter &&
    (evidence?.['scopeIdentity'] !== 'encounter+difficulty' ||
      evidence?.['crossDifficultyComparisonForbidden'] !== true)
  ) {
    throw new ApiContractError(
      INTELLIGENCE_CONTRACT,
      'difficulty-isolation evidence contract is missing',
    );
  }
  const knowledge = optionalRecord(root['raidKnowledge']);
  const reliability = optionalRecord(root['reliability']);
  const profiles = Array.isArray(reliability?.['profiles'])
    ? reliability!['profiles'].map(decodeProfile)
    : [];
  const matrix = Array.isArray(root['playerMatrix'])
    ? root['playerMatrix'].map((value, index) => {
        const row = requireRecord(value, INTELLIGENCE_CONTRACT);
        const actorId = requirePositiveInteger(
          row['actorId'],
          `playerMatrix[${index}].actorId`,
          INTELLIGENCE_CONTRACT,
        );
        return {
          actorId,
          name: text(row['name']) ?? `Actor ${actorId}`,
          failures: nonNegative(row['failures']) ?? 0,
          recentFailures: nonNegative(row['recentFailures']) ?? 0,
          linkedDeaths: nonNegative(row['linkedDeaths']) ?? 0,
          mechanics: decodeMechanics(row['mechanics']),
        };
      })
    : [];
  return {
    generatedAt: finite(root['generatedAt']) ?? Date.now(),
    status: text(root['status']) ?? 'unknown',
    encounter,
    homeRaidEligible:
      typeof knowledge?.['homeRaidEligible'] === 'boolean' ? knowledge['homeRaidEligible'] : null,
    reliabilityModelVersion: text(reliability?.['modelVersion']),
    reliabilityPolicy: text(reliability?.['publicationPolicy']),
    profiles,
    matrix,
  };
}

export function decodePlayersHistory(value: unknown): PlayersHistoryDto {
  const root = requireRecord(value, HISTORY_CONTRACT);
  if (root['ok'] !== true)
    throw new ApiContractError(HISTORY_CONTRACT, 'response must declare ok=true');
  if (root['networkExecuted'] !== false || Number(root['wclCallsExecuted']) !== 0)
    throw new ApiContractError(
      HISTORY_CONTRACT,
      'persisted history read must execute zero WCL calls',
    );
  const encounterRow = optionalRecord(root['encounter']);
  const encounter = encounterRow
    ? (() => {
        const id = requirePositiveInteger(encounterRow['id'], 'encounter.id', HISTORY_CONTRACT);
        const difficulty = requirePositiveInteger(
          encounterRow['difficulty'],
          'encounter.difficulty',
          HISTORY_CONTRACT,
        );
        const scopeKey = text(encounterRow['scopeKey']) ?? `${id}:d${difficulty}`;
        if (scopeKey !== `${id}:d${difficulty}`)
          throw new ApiContractError(
            HISTORY_CONTRACT,
            'history scopeKey contradicts encounter+difficulty',
          );
        return { id, difficulty, scopeKey };
      })()
    : null;
  const attendance = optionalRecord(root['playerAttendance']);
  const rows = Array.isArray(attendance?.['players'])
    ? attendance!['players'].flatMap((value, index) => {
        const row = requireRecord(value, HISTORY_CONTRACT);
        const identity = requireRecord(row['identity'], HISTORY_CONTRACT);
        const identityKey = text(identity['key']);
        if (!identityKey)
          throw new ApiContractError(
            HISTORY_CONTRACT,
            `playerAttendance.players[${index}].identity.key is required`,
          );
        return [
          {
            identityKey,
            firstIndexedAt: finite(row['firstIndexedAt']),
            lastIndexedAt: finite(row['lastIndexedAt']),
            sessionsAttended: nonNegative(row['sessionsAttended']) ?? 0,
            eligibleSessions: nonNegative(row['eligibleSessions']) ?? 0,
            sessionAttendancePct: nonNegative(row['sessionAttendancePct']),
            pullsAttended: nonNegative(row['pullsAttended']) ?? 0,
            eligiblePulls: nonNegative(row['eligiblePulls']) ?? 0,
            pullPresencePct: nonNegative(row['pullPresencePct']),
          },
        ];
      })
    : [];
  return { encounter, rows, semantics: text(attendance?.['semantics']), networkExecuted: false };
}
