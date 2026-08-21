import { decodeDefensiveAuditResponse } from './defensive-audit-api.contract';

const scope = { reportCode: 'ABC123', encounterId: 3010, difficulty: 5 as const };
const isolation = {
  scopeIdentity: 'encounter+difficulty',
  crossDifficultyComparisonForbidden: true,
};

function fixture() {
  return {
    ok: true,
    version: 'operational-execution-v1',
    generatedAt: 1,
    status: 'ready',
    raidKnowledge: { homeRaidEligible: true },
    encounter: { id: 3010, difficulty: 5, scopeKey: '3010:d5' },
    analysisPopulation: {
      rawPulls: 3,
      eligiblePulls: 2,
      excludedPulls: [{ fightId: 12 }],
      eligibleFightIds: [10, 11],
    },
    telemetry: {
      reportCode: 'ABC123',
      encounter: {
        id: 3010,
        name: 'Test Boss',
        difficulty: 5,
        difficultyName: 'Mythic',
        scopeKey: '3010:d5',
      },
      analysisPopulation: {
        rawPulls: 3,
        eligiblePulls: 2,
        excludedPulls: [{ fightId: 12 }],
      },
      pullIntelligence: { pulls: [{ fightId: 10 }, { fightId: 11 }] },
      deaths: {
        rawCount: 3,
        meaningfulCount: 2,
        firstDeathCount: 2,
        wipeCutoff: 5,
      },
      players: [
        {
          actorId: 1,
          name: 'Aster',
          className: 'Warrior',
          spec: 'Protection',
          role: 'TANK',
          encounter: { deaths: 2, meaningfulDeaths: 1, firstDeaths: 1 },
        },
      ],
      consumables: {
        detectedUsesByPlayerName: {
          aster: { healthstone: 1, potion: 2 },
          birch: { healthstone: 0, potion: 1 },
        },
        availability: 'not-proven-by-wcl',
      },
      bestPullEvents: { pagesIncomplete: { deaths: false } },
      evidenceContract: isolation,
    },
    mechanics: { failures: [] },
    deathChains: {
      status: 'probable-causality',
      windowMs: 10_000,
      total: 2,
      classified: 1,
      chains: [
        {
          fightId: 10,
          actorId: 1,
          player: 'Aster',
          deathAtMs: 110_000,
          fightRelativeMs: 60_000,
          killingBlow: 'Impact',
          confidence: 'high',
          probableCause: {
            mechanicKey: 'impact',
            mechanicName: 'Impact',
            reason: 'Observed classified failure',
            occurredMsBeforeDeath: 2_000,
          },
          evidence: [
            {
              mechanicKey: 'impact',
              mechanicName: 'Impact',
              reason: 'Observed classified failure',
              deltaMs: 2_000,
              confidence: 'confirmed',
            },
          ],
        },
        {
          fightId: 11,
          actorId: 2,
          player: 'Birch',
          deathAtMs: 220_000,
          fightRelativeMs: 70_000,
          killingBlow: 'Unknown hit',
          confidence: 'unknown',
          probableCause: null,
          evidence: [],
        },
      ],
    },
    dataCompleteness: { meaningfulDeaths: { events: 2, truncated: false } },
    evidenceContract: {
      ...isolation,
      observedMechanicDoesNotImplyFailure: true,
    },
  };
}

describe('Defensive Audit API contract', () => {
  it('projects observed deaths, consumable casts and probable chains without readiness claims', () => {
    const result = decodeDefensiveAuditResponse(fixture(), scope);
    expect(result.status).toBe('ready');
    expect(result.deathCounts).toMatchObject({ raw: 3, meaningful: 2, first: 2, linked: 1 });
    expect(result.observedConsumables).toMatchObject({ healthstones: 1, potions: 3 });
    expect(result.evidence).toMatchObject({
      preventability: 'not-assessed',
      defensiveAvailability: 'unknown',
      inventoryAvailability: 'unknown',
      causality: 'probable-temporal-association-only',
    });
    expect(result.participants.find((row) => row.actorId === 2)?.source).toBe('death-chain-actor');
  });

  it('retains observed telemetry when operational mechanic classification is gated', () => {
    const payload = fixture();
    payload.status = 'boss-reference-not-ready';
    payload.mechanics = null as never;
    payload.deathChains = null as never;
    payload.evidenceContract = {
      dataReadyDoesNotImplyLiveReady: true,
      sameDifficultyOnly: true,
    } as never;
    const result = decodeDefensiveAuditResponse(payload, scope);
    expect(result.classificationStatus).toBe('gated');
    expect(result.deathCounts.meaningful).toBe(2);
    expect(result.chains).toEqual([]);
  });

  it('marks an external report without discarding its execution evidence', () => {
    const payload = fixture();
    payload.raidKnowledge.homeRaidEligible = false;
    expect(decodeDefensiveAuditResponse(payload, scope).homeRaidEligible).toBe(false);
  });

  it('fails closed on cross-scope telemetry or contradictory chain totals', () => {
    const crossed = fixture();
    crossed.telemetry.encounter.difficulty = 4;
    expect(() => decodeDefensiveAuditResponse(crossed, scope)).toThrow(/response scope/);

    const contradictory = fixture();
    contradictory.deathChains.classified = 2;
    expect(() => decodeDefensiveAuditResponse(contradictory, scope)).toThrow(/death-chain totals/);
  });

  it('rejects probable causes outside the declared temporal window', () => {
    const payload = fixture();
    payload.deathChains.chains[0].probableCause!.occurredMsBeforeDeath = 20_000;
    expect(() => decodeDefensiveAuditResponse(payload, scope)).toThrow(/outside/);
  });

  it('rejects overlapping pull populations and impossible death populations', () => {
    const overlap = fixture();
    overlap.analysisPopulation.excludedPulls[0].fightId = 10;
    expect(() => decodeDefensiveAuditResponse(overlap, scope)).toThrow(/overlap/);

    const impossibleDeaths = fixture();
    impossibleDeaths.telemetry.deaths.firstDeathCount = 3;
    expect(() => decodeDefensiveAuditResponse(impossibleDeaths, scope)).toThrow(/death populations/);
  });

  it('rejects a zero actor ID instead of creating an ambiguous participant', () => {
    const payload = fixture();
    payload.deathChains.chains[0].actorId = 0;
    expect(() => decodeDefensiveAuditResponse(payload, scope)).toThrow(/positive integer/);
  });
});
