import { describe, expect, it } from 'vitest';
import {
  joinAttendance,
  publicComponentValue,
  publicReliabilityValue,
  rosterReliability,
} from './players.rules';
import { PlayersPlayer, ReliabilityProfile } from './players.models';

const component = {
  dimension: 'mechanics' as const,
  status: 'scored' as const,
  value: 88,
  why: null,
  opportunityCount: 20,
  failureCount: 2,
};
const profile = (
  status: ReliabilityProfile['status'],
  value: number | null,
): ReliabilityProfile => ({
  modelVersion: '1.1.0',
  identityKey: 'wcl:1',
  identityStatus: 'canonical',
  actorId: 1,
  reportCode: 'ABC123',
  encounterId: 3010,
  difficulty: 5,
  partition: null,
  status,
  value,
  confidence: 'medium',
  pullsAttended: 20,
  nights: 2,
  components: {
    mechanics: component,
    survival: { ...component, dimension: 'survival' },
    defensives: { ...component, dimension: 'defensives' },
    duties: { ...component, dimension: 'duties' },
  },
  publicationReasons: [],
  explanation: '',
  observedNotScored: [],
  dataIntegrityErrors: [],
});
const player = (reliability: ReliabilityProfile | null): PlayersPlayer => ({
  actorId: 1,
  name: 'Raider',
  className: null,
  spec: null,
  role: null,
  server: 'Draenor',
  source: 'best-pull-roster',
  bestPullOutput: null,
  outputUnit: null,
  encounterFacts: {
    deaths: null,
    meaningfulDeaths: null,
    firstDeaths: null,
    interrupts: null,
    dispels: null,
    classifiedFailures: null,
    recentFailures: null,
    linkedDeaths: null,
    mechanics: {},
  },
  reliability,
  attendance: null,
});

describe('Players publication and identity rules', () => {
  it('never exposes pending component or overall shadow values', () => {
    const pending = profile('shadow-pending', null);
    expect(publicReliabilityValue(pending)).toBeNull();
    expect(publicComponentValue(pending, component)).toBeNull();
  });

  it('aggregates published values only', () => {
    expect(
      rosterReliability([
        player(profile('published', 90)),
        player(profile('shadow-pending', null)),
        player(null),
      ]),
    ).toEqual({ value: 90, published: 1 });
  });

  it('joins attendance only by exact realm and name, never name alone', () => {
    const row = {
      identityKey: 'draenor:raider',
      firstIndexedAt: null,
      lastIndexedAt: null,
      sessionsAttended: 1,
      eligibleSessions: 2,
      sessionAttendancePct: 50,
      pullsAttended: 5,
      eligiblePulls: 10,
      pullPresencePct: 50,
    };
    expect(joinAttendance(player(null), [row])?.identityKey).toBe(row.identityKey);
    expect(joinAttendance({ name: 'Raider', server: null }, [row])).toBeNull();
    expect(joinAttendance({ name: 'Raider', server: 'Tarren Mill' }, [row])).toBeNull();
  });
});
