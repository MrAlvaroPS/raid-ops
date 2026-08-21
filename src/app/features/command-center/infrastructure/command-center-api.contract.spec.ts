import { decodeCommandCenterResponse } from './command-center-api.contract';

const scope = { reportCode: 'ABC123', encounterId: 3010, difficulty: 5 as const };
const isolation = {
  scopeIdentity: 'encounter+difficulty',
  crossDifficultyComparisonForbidden: true,
};

function pull(overrides: Record<string, unknown> = {}) {
  return {
    fightId: 10,
    pullNumber: 1,
    kill: false,
    fightPercentage: 55,
    durationMs: 120_000,
    stageCount: 1,
    meaningfulDeaths: 2,
    raidDps: 1_100_000,
    rosterFingerprint: '1-2-3',
    ...overrides,
  };
}

function fixture() {
  const pulls = [
    pull(),
    pull({
      fightId: 11,
      pullNumber: 2,
      fightPercentage: 22,
      durationMs: 180_000,
      stageCount: 2,
      meaningfulDeaths: 1,
      raidDps: 1_300_000,
      rosterFingerprint: '1-2-4',
    }),
  ];
  return {
    ok: true,
    version: 'operational-execution-v1',
    generatedAt: 1,
    status: 'ready',
    report: { code: 'ABC123' },
    encounter: {
      id: 3010,
      name: 'Test Boss',
      difficulty: 5,
      difficultyName: 'Mythic',
      scopeKey: '3010:d5',
      inProgress: false,
    },
    raidKnowledge: { homeRaidEligible: true },
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
      pullIntelligence: {
        pulls,
        latest: pulls[1],
        previous: pulls[0],
        best: pulls[1],
        analysisPopulation: {
          rawPulls: 3,
          eligiblePulls: 2,
          excludedPulls: [{ fightId: 12 }],
          eligibleFightIds: [10, 11],
        },
      },
      deaths: { rawCount: 5, meaningfulCount: 3, firstDeathCount: 2 },
      evidenceContract: isolation,
    },
    blocker: {
      status: 'derived',
      confidence: 'high',
      scoringModel: 'severity x recurrence x rate x recency x linked deaths',
      blocker: {
        key: 'impact',
        name: 'Impact',
        failedOccurrences: 2,
        recentFailures: 1,
        opportunities: 4,
        failureRate: 0.5,
        fights: [10, 11],
        recurrence: 2,
        linkedDeaths: 1,
        denominatorStatus: 'normalized',
      },
    },
    dataCompleteness: {
      mechanicDamage: { truncated: false },
      assignmentAuras: { truncated: false },
      meaningfulDeaths: { truncated: false },
    },
    rulePack: { slug: 'test', version: '1', source: 'manual-fallback' },
    evidenceContract: {
      ...isolation,
      observedMechanicDoesNotImplyFailure: true,
      observedCountsAreOccurrenceNormalized: true,
    },
  };
}

describe('Command Center API contract', () => {
  it('projects one operational snapshot without inventing kill readiness', () => {
    const result = decodeCommandCenterResponse(fixture(), scope);
    expect(result.status).toBe('ready');
    expect(result.bestPull?.fightPercentage).toBe(22);
    expect(result.comparison).toMatchObject({ currentPull: 2, baselinePull: 1 });
    expect(result.blocker).toMatchObject({ name: 'Impact', failedOccurrences: 2 });
    expect(result.evidence.killReadiness).toBe('not-assessed');
  });

  it('retains completed analytics while an active pull is visible', () => {
    const payload = fixture();
    payload.encounter.inProgress = true;
    const result = decodeCommandCenterResponse(payload, scope);
    expect(result.encounter?.inProgress).toBe(true);
    expect(result.partialReasons.join(' ')).toMatch(/last completed analytical snapshot/);
  });

  it('keeps telemetry but gates blockers without an operational reference', () => {
    const payload = fixture();
    payload.status = 'boss-reference-not-ready';
    delete (payload as { encounter?: unknown }).encounter;
    delete (payload as { analysisPopulation?: unknown }).analysisPopulation;
    delete (payload as { raidKnowledge?: unknown }).raidKnowledge;
    payload.telemetry.pullIntelligence.analysisPopulation = {
      rawPulls: 3,
      eligiblePulls: 2,
      excludedPulls: [{ fightId: 12 }],
      eligibleFightIds: [10, 11],
    };
    payload.blocker = null as never;
    payload.rulePack = null as never;
    payload.evidenceContract = {
      ...isolation,
      noReferenceMeansNoFabricatedMechanicClassification: true,
    } as never;
    const result = decodeCommandCenterResponse(payload, scope);
    expect(result.classificationStatus).toBe('gated');
    expect(result.blocker).toBeNull();
    expect(result.bestPull?.fightId).toBe(11);
    expect(result.encounter?.inProgress).toBeNull();
    expect(result.homeRaidEligible).toBeNull();
  });

  it('represents an open first pull without promoting it to completed evidence', () => {
    const result = decodeCommandCenterResponse(
      {
        ok: true,
        generatedAt: 1,
        status: 'waiting-for-completed-pull',
        report: { code: 'ABC123' },
        raidKnowledge: { homeRaidEligible: true },
        encounter: {
          id: 3010,
          difficulty: 5,
          scopeKey: '3010:d5',
          inProgress: true,
        },
        telemetry: null,
      },
      scope,
    );
    expect(result.status).toBe('empty');
    expect(result.encounter?.inProgress).toBe(true);
    expect(result.pulls).toEqual([]);
  });

  it('marks external evaluation and partial evidence explicitly', () => {
    const payload = fixture();
    payload.raidKnowledge.homeRaidEligible = false;
    payload.dataCompleteness.mechanicDamage.truncated = true;
    const result = decodeCommandCenterResponse(payload, scope);
    expect(result.homeRaidEligible).toBe(false);
    expect(result.partialReasons.join(' ')).toMatch(/external evaluation/i);
    expect(result.partialReasons.join(' ')).toMatch(/truncated/i);
  });

  it('fails closed on scope, population and blocker contradictions', () => {
    const crossed = fixture();
    crossed.telemetry.encounter.difficulty = 4;
    expect(() => decodeCommandCenterResponse(crossed, scope)).toThrow(/response scope/);

    const overlap = fixture();
    overlap.analysisPopulation.excludedPulls[0].fightId = 10;
    expect(() => decodeCommandCenterResponse(overlap, scope)).toThrow(/population/);

    const impossibleBlocker = fixture();
    impossibleBlocker.blocker.blocker.recentFailures = 3;
    expect(() => decodeCommandCenterResponse(impossibleBlocker, scope)).toThrow(/blocker/);
  });
});
