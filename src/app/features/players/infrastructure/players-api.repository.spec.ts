import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { PlayersApiRepository } from './players-api.repository';

const scope = { reportCode: 'ABC123', encounterId: 3010, difficulty: 5 as const };
const isolation = {
  scopeIdentity: 'encounter+difficulty',
  crossDifficultyComparisonForbidden: true,
};
const telemetry = {
  ok: true,
  reportCode: 'ABC123',
  generatedAt: 1,
  encounter: {
    id: 3010,
    name: 'Test Boss',
    difficulty: 5,
    difficultyName: 'Mythic',
    scopeKey: '3010:d5',
    pulls: 4,
  },
  players: [
    {
      actorId: 7,
      name: 'Raider',
      className: 'Mage',
      spec: 'Arcane',
      role: 'DPS',
      server: 'Draenor',
      bestPull: { dps: 1000, hps: 0 },
      encounter: { deaths: 1, meaningfulDeaths: 1, firstDeaths: 0, interrupts: 2, dispels: 0 },
    },
  ],
  evidenceContract: isolation,
};
const component = (dimension: string) => ({
  dimension,
  status: 'pending',
  value: null,
  sample: { opportunityCount: 0, failures: 0 },
});
const intelligence = {
  ok: true,
  generatedAt: 2,
  status: 'ready',
  encounter: { id: 3010, difficulty: 5, scopeKey: '3010:d5' },
  raidKnowledge: { homeRaidEligible: true },
  reliability: {
    modelVersion: '1.1.0',
    publicationPolicy: 'Gated',
    profiles: [
      {
        modelVersion: '1.1.0',
        status: 'shadow-pending',
        value: null,
        identity: {
          key: 'character:eu:draenor:raider',
          status: 'provisional-name-realm',
          actorId: 7,
        },
        context: {
          reportCode: 'ABC123',
          encounterId: 3010,
          difficulty: 5,
          partition: null,
          nights: 1,
        },
        participation: { pullsAttended: 3 },
        confidence: { level: 'low' },
        components: {
          mechanics: component('mechanics'),
          survival: component('survival'),
          defensives: component('defensives'),
          duties: component('duties'),
        },
        publication: { publishable: false, reasons: ['nights 1/2'] },
        explanation: { summary: 'Pending' },
        dataIntegrity: { errors: [] },
      },
    ],
  },
  playerMatrix: [
    {
      actorId: 7,
      name: 'Raider',
      failures: 1,
      recentFailures: 1,
      linkedDeaths: 0,
      mechanics: { observed: 1 },
    },
    {
      actorId: 9,
      name: 'Substitute',
      failures: 2,
      recentFailures: 2,
      linkedDeaths: 1,
      mechanics: { observed: 2 },
    },
  ],
  evidenceContract: isolation,
};
const history = {
  ok: true,
  networkExecuted: false,
  wclCallsExecuted: 0,
  encounter: { id: 3010, difficulty: 5, scopeKey: '3010:d5' },
  playerAttendance: {
    semantics: 'Observed presence only',
    players: [
      {
        identity: { key: 'draenor:raider' },
        sessionsAttended: 2,
        eligibleSessions: 3,
        pullsAttended: 7,
        eligiblePulls: 10,
        pullPresencePct: 70,
      },
    ],
  },
};

describe('Players API repository', () => {
  it('uses exact report reads plus one report-independent persisted HOME attendance read', async () => {
    const get = vi.fn((url: string) =>
      of(
        url.includes('/telemetry?')
          ? telemetry
          : url.includes('/intelligence?')
            ? intelligence
            : history,
      ),
    );
    const repository = new PlayersApiRepository(
      new LegacyApiClient({ get } as unknown as HttpClient),
    );
    const result = await repository.load(scope);
    expect(get).toHaveBeenCalledWith(
      '/api/wcl/telemetry?report=ABC123&encounter=3010&difficulty=5',
    );
    expect(get).toHaveBeenCalledWith(
      '/api/wcl/intelligence?report=ABC123&encounter=3010&difficulty=5',
    );
    expect(get).toHaveBeenCalledWith('/api/wcl/home-history?encounter=3010&difficulty=5');
    expect(result.players).toHaveLength(2);
    expect(result.players.find((player) => player.actorId === 7)?.attendance?.pullPresencePct).toBe(
      70,
    );
    expect(result.players.find((player) => player.actorId === 9)?.source).toBe(
      'classified-execution-actor',
    );
  });

  it('does not admit an external roster into the Players product', async () => {
    const external = {
      ...intelligence,
      raidKnowledge: { homeRaidEligible: false },
      reliability: { modelVersion: '1.1.0', publicationPolicy: 'HOME only', profiles: [] },
      playerMatrix: [],
    };
    const get = vi.fn((url: string) =>
      of(
        url.includes('/telemetry?')
          ? telemetry
          : url.includes('/intelligence?')
            ? external
            : history,
      ),
    );
    const result = await new PlayersApiRepository(
      new LegacyApiClient({ get } as unknown as HttpClient),
    ).load(scope);
    expect(result).toMatchObject({
      status: 'external-not-applicable',
      players: [],
      reliabilityState: 'not-applicable',
    });
  });

  it('fails closed when a Reliability profile crosses report scope', async () => {
    const crossed = structuredClone(intelligence);
    crossed.reliability.profiles[0].context.reportCode = 'OTHER';
    const get = vi.fn((url: string) =>
      of(
        url.includes('/telemetry?')
          ? telemetry
          : url.includes('/intelligence?')
            ? crossed
            : history,
      ),
    );
    await expect(
      new PlayersApiRepository(new LegacyApiClient({ get } as unknown as HttpClient)).load(scope),
    ).rejects.toThrow(/crosses the requested scope/);
  });

  it('fails closed when an optional endpoint violates its decoded contract', async () => {
    const malformedIntelligence = { ...intelligence, evidenceContract: {} };
    const get = vi.fn((url: string) =>
      of(
        url.includes('/telemetry?')
          ? telemetry
          : url.includes('/intelligence?')
            ? malformedIntelligence
            : history,
      ),
    );
    await expect(
      new PlayersApiRepository(new LegacyApiClient({ get } as unknown as HttpClient)).load(scope),
    ).rejects.toThrow(/players-intelligence-v1/);
  });
});
