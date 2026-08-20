import { ApiContractError } from '../../../core/http/api-contract';
import {
  decodePlayersHistory,
  decodePlayersIntelligence,
  decodePlayersTelemetry,
} from './players-api.contract';

const component = (dimension: string) => ({
  dimension,
  status: 'pending',
  value: null,
  sample: { opportunityCount: 0, failures: 0 },
});
const profile = {
  modelVersion: '1.1.0',
  status: 'shadow-pending',
  value: null,
  identity: { key: 'character:eu:draenor:raider', status: 'provisional-name-realm', actorId: 7 },
  context: { reportCode: 'ABC123', encounterId: 3010, difficulty: 5, partition: null, nights: 1 },
  participation: { pullsAttended: 4 },
  confidence: { level: 'low' },
  components: {
    mechanics: component('mechanics'),
    survival: component('survival'),
    defensives: component('defensives'),
    duties: component('duties'),
  },
  publication: { publishable: false, reasons: ['nights 1/2'] },
  explanation: { summary: 'Pending', observedNotScored: ['No denominator'] },
  dataIntegrity: { errors: [] },
};
const intelligence = {
  ok: true,
  generatedAt: 2,
  status: 'ready',
  encounter: { id: 3010, difficulty: 5, scopeKey: '3010:d5' },
  raidKnowledge: { homeRaidEligible: true },
  reliability: {
    modelVersion: '1.1.0',
    publicationPolicy: 'Publication gated',
    profiles: [profile],
  },
  playerMatrix: [
    {
      actorId: 7,
      name: 'Raider',
      failures: 2,
      recentFailures: 1,
      linkedDeaths: 1,
      mechanics: { test_mechanic: 2 },
    },
  ],
  evidenceContract: {
    scopeIdentity: 'encounter+difficulty',
    crossDifficultyComparisonForbidden: true,
  },
};

describe('Players API contracts', () => {
  it('decodes nullable roles without coercing an unknown player to DPS', () => {
    const result = decodePlayersTelemetry({
      ok: true,
      reportCode: 'ABC123',
      generatedAt: 1,
      encounter: {
        id: 3010,
        difficulty: 5,
        difficultyName: 'Mythic',
        scopeKey: '3010:d5',
        pulls: 4,
      },
      players: [
        {
          actorId: 7,
          name: 'Raider',
          role: null,
          server: { slug: 'Draenor' },
          bestPull: { dps: 10 },
          encounter: {},
        },
      ],
      evidenceContract: {
        scopeIdentity: 'encounter+difficulty',
        crossDifficultyComparisonForbidden: true,
      },
    });
    expect(result.players[0]).toMatchObject({ role: null, server: 'Draenor' });
  });

  it('decodes pending profiles without exposing shadowValue', () => {
    const result = decodePlayersIntelligence({
      ...intelligence,
      reliability: { ...intelligence.reliability, profiles: [{ ...profile, shadowValue: 91 }] },
    });
    expect(result.profiles[0].value).toBeNull();
    expect(result.profiles[0]).not.toHaveProperty('shadowValue');
  });

  it('rejects a numeric value before both publication gates pass', () => {
    const payload = structuredClone(intelligence);
    (payload.reliability.profiles[0] as unknown as { value: number | null }).value = 91;
    expect(() => decodePlayersIntelligence(payload)).toThrowError(/before publication/);
  });

  it('rejects a published status that contradicts publication.publishable', () => {
    const payload = structuredClone(intelligence);
    payload.reliability.profiles[0].status = 'published';
    (payload.reliability.profiles[0] as unknown as { value: number | null }).value = 91;
    expect(() => decodePlayersIntelligence(payload)).toThrowError(/publication status contradicts/);
  });

  it('rejects missing difficulty-isolation evidence', () => {
    expect(() => decodePlayersIntelligence({ ...intelligence, evidenceContract: {} })).toThrowError(
      ApiContractError,
    );
  });

  it('accepts persisted attendance only when the read declares zero WCL calls', () => {
    const history = {
      ok: true,
      networkExecuted: false,
      wclCallsExecuted: 0,
      encounter: { id: 3010, difficulty: 5, scopeKey: '3010:d5' },
      playerAttendance: {
        semantics: 'Observed presence',
        players: [
          {
            identity: { key: 'draenor:raider' },
            sessionsAttended: 1,
            eligibleSessions: 2,
            pullsAttended: 4,
            eligiblePulls: 8,
          },
        ],
      },
    };
    expect(decodePlayersHistory(history).rows).toHaveLength(1);
    expect(() =>
      decodePlayersHistory({ ...history, networkExecuted: true, wclCallsExecuted: 1 }),
    ).toThrowError(/zero WCL/);
  });
});
