import { WclScope } from '../../../shared/domain/wcl-scope';

export type DefensiveAuditScope = WclScope;
export type DefensiveAuditStatus = 'ready' | 'empty';
export type ClassificationStatus = 'ready' | 'gated';
export type DefensiveAuditFilter = 'all' | 'deaths' | 'linked';

export interface DefensiveEncounter {
  readonly id: number;
  readonly name: string | null;
  readonly difficulty: number;
  readonly difficultyName: string;
  readonly scopeKey: string;
}

export interface DefensivePopulation {
  readonly rawPulls: number;
  readonly eligiblePulls: number;
  readonly excludedPulls: number;
  readonly eligibleFightIds: readonly number[];
}

export interface DefensiveParticipant {
  readonly actorId: number;
  readonly name: string;
  readonly className: string | null;
  readonly spec: string | null;
  readonly role: string | null;
  readonly source: 'best-pull-roster' | 'death-chain-actor';
  readonly rawDeaths: number | null;
  readonly meaningfulDeaths: number | null;
  readonly firstDeaths: number | null;
  readonly observedHealthstones: number;
  readonly observedPotions: number;
  readonly linkedChains: number;
}

export interface DefensiveChainEvidence {
  readonly mechanicKey: string | null;
  readonly mechanicName: string;
  readonly reason: string | null;
  readonly occurredMsBeforeDeath: number;
  readonly confidence: string | null;
}

export interface DefensiveDeathChain {
  readonly key: string;
  readonly fightId: number;
  readonly actorId: number | null;
  readonly player: string | null;
  readonly deathAtMs: number;
  readonly fightRelativeMs: number | null;
  readonly killingBlow: string | null;
  readonly confidence: string;
  readonly probableCause: {
    readonly mechanicKey: string;
    readonly mechanicName: string;
    readonly reason: string | null;
    readonly occurredMsBeforeDeath: number;
  } | null;
  readonly evidence: readonly DefensiveChainEvidence[];
}

export interface DefensiveAuditSnapshot {
  readonly status: DefensiveAuditStatus;
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: DefensiveEncounter | null;
  readonly population: DefensivePopulation | null;
  readonly homeRaidEligible: boolean | null;
  readonly participants: readonly DefensiveParticipant[];
  readonly chains: readonly DefensiveDeathChain[];
  readonly classificationStatus: ClassificationStatus;
  readonly classificationReason: string | null;
  readonly deathCounts: {
    readonly raw: number;
    readonly meaningful: number;
    readonly first: number;
    readonly linked: number;
    readonly wipeCutoff: number;
  };
  readonly observedConsumables: {
    readonly healthstones: number;
    readonly potions: number;
    readonly availability: 'not-proven-by-wcl';
  };
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
  readonly evidence: {
    readonly source: 'Warcraft Logs API v2';
    readonly metricContract: 'defensive-audit-observational-v1';
    readonly scopeIdentity: 'report+encounter+difficulty';
    readonly preventability: 'not-assessed';
    readonly defensiveAvailability: 'unknown';
    readonly inventoryAvailability: 'unknown';
    readonly causality: 'probable-temporal-association-only';
  };
}
