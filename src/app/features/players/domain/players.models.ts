import { WclScope } from '../../../shared/domain/wcl-scope';

export type PlayersScope = WclScope;
export type PlayerRole = 'TANK' | 'HEAL' | 'DPS' | null;
export type ReliabilityStatus = 'published' | 'shadow-pending' | 'data-error';
export type ReliabilityDimension = 'mechanics' | 'survival' | 'defensives' | 'duties';

export interface PlayersEncounter {
  readonly id: number;
  readonly name: string | null;
  readonly difficulty: number;
  readonly difficultyName: string;
  readonly scopeKey: string;
  readonly eligiblePulls: number;
}

export interface ReliabilityComponent {
  readonly dimension: ReliabilityDimension;
  readonly status: 'pending' | 'scored';
  readonly value: number | null;
  readonly why: string | null;
  readonly opportunityCount: number;
  readonly failureCount: number;
}

export interface ReliabilityProfile {
  readonly modelVersion: string;
  readonly identityKey: string;
  readonly identityStatus: 'canonical' | 'provisional-name-realm' | 'report-scoped';
  readonly actorId: number;
  readonly reportCode: string;
  readonly encounterId: number;
  readonly difficulty: number;
  readonly partition: number | null;
  readonly status: ReliabilityStatus;
  readonly value: number | null;
  readonly confidence: string;
  readonly pullsAttended: number;
  readonly nights: number;
  readonly components: Readonly<Record<ReliabilityDimension, ReliabilityComponent>>;
  readonly publicationReasons: readonly string[];
  readonly explanation: string;
  readonly observedNotScored: readonly string[];
  readonly dataIntegrityErrors: readonly string[];
}

export interface PlayerAttendance {
  readonly identityKey: string;
  readonly firstIndexedAt: number | null;
  readonly lastIndexedAt: number | null;
  readonly sessionsAttended: number;
  readonly eligibleSessions: number;
  readonly sessionAttendancePct: number | null;
  readonly pullsAttended: number;
  readonly eligiblePulls: number;
  readonly pullPresencePct: number | null;
}

export interface PlayersPlayer {
  readonly actorId: number;
  readonly name: string;
  readonly className: string | null;
  readonly spec: string | null;
  readonly role: PlayerRole;
  readonly server: string | null;
  readonly source: 'best-pull-roster' | 'classified-execution-actor';
  readonly bestPullOutput: number | null;
  readonly outputUnit: 'DPS' | 'HPS' | null;
  readonly encounterFacts: {
    readonly deaths: number | null;
    readonly meaningfulDeaths: number | null;
    readonly firstDeaths: number | null;
    readonly interrupts: number | null;
    readonly dispels: number | null;
    readonly classifiedFailures: number | null;
    readonly recentFailures: number | null;
    readonly linkedDeaths: number | null;
    readonly mechanics: Readonly<Record<string, number>>;
  };
  readonly reliability: ReliabilityProfile | null;
  readonly attendance: PlayerAttendance | null;
}

export interface PlayersSnapshot {
  readonly status: 'ready' | 'empty' | 'external-not-applicable';
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: PlayersEncounter | null;
  readonly players: readonly PlayersPlayer[];
  readonly reliabilityModelVersion: string | null;
  readonly reliabilityState: 'available' | 'partial' | 'unavailable' | 'not-applicable';
  readonly reliabilityPolicy: string | null;
  readonly partialReasons: readonly string[];
  readonly attendanceSemantics: string | null;
  readonly historyNetworkExecuted: boolean | null;
  readonly omittedClassifiedActors: number;
}
