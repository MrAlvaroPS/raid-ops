import { WclScope } from '../../../shared/domain/wcl-scope';

export type CompositionScope = WclScope;

export interface CompositionEncounter {
  readonly id: number;
  readonly name: string | null;
  readonly difficulty: number;
  readonly difficultyName: string;
  readonly scopeKey: string;
  readonly pulls: number;
}

export interface GearItem {
  readonly id: number | null;
  readonly name: string | null;
  readonly itemLevel: number | null;
  readonly slot: string | null;
  readonly quality: number | null;
}

export interface TalentItem {
  readonly id: number | null;
  readonly spellId: number | null;
  readonly name: string | null;
  readonly points: number | null;
}

export interface CompositionPlayer {
  readonly actorId: number;
  readonly name: string;
  readonly className: string | null;
  readonly spec: string | null;
  readonly itemLevel: number | null;
  readonly role: 'TANK' | 'HEAL' | 'DPS' | null;
  readonly server: string | null;
  readonly bestPull: {
    readonly dps: number;
    readonly hps: number;
  };
  readonly character: {
    readonly gear: readonly GearItem[];
    readonly gearCount: number;
    readonly talents: readonly TalentItem[];
    readonly talentCount: number;
    readonly talentImportCode: string | null;
    readonly talentWowheadUrl: string | null;
    readonly combatantInfoSource: string | null;
  };
  readonly reliability: {
    readonly value: number | null;
    readonly status: string;
    readonly confidence: string;
    readonly reason: string | null;
  };
}

export interface ProfileCoverage {
  readonly roster: number;
  readonly withGear: number;
  readonly withTalents: number;
  readonly gearPct: number;
  readonly talentPct: number;
}

export interface CompositionSnapshot {
  readonly status: 'ready' | 'empty';
  readonly generatedAt: number;
  readonly reportCode: string;
  readonly encounter: CompositionEncounter | null;
  readonly players: readonly CompositionPlayer[];
  readonly coverage: ProfileCoverage | null;
  readonly profileSource: string | null;
  readonly partialReasons: readonly string[];
  readonly emptyReason: string | null;
  readonly evidence: {
    readonly source: string;
    readonly scopeIdentity: 'encounter+difficulty';
    readonly crossDifficultyComparisonForbidden: true;
  } | null;
}

export interface CompositionSummary {
  readonly roster: number;
  readonly tanks: number;
  readonly healers: number;
  readonly melee: number;
  readonly ranged: number;
  readonly unclassified: number;
  readonly classes: number;
  readonly averageItemLevel: number | null;
  readonly missingClasses: readonly WowClass[];
}

export interface WowClass {
  readonly key: string;
  readonly name: string;
  readonly color: string;
}
