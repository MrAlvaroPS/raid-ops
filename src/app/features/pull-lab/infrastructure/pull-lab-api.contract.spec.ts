import { ApiContractError } from '../../../core/http/api-contract';
import { decodePullLabResponse } from './pull-lab-api.contract';

const scope = { reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 as const };
const stage = {
  absoluteStageIndex: 1,
  semanticPhaseId: 1,
  startTime: 0,
  endTime: 60_000,
  inferred: false,
};
const pull = (fightId: number, pullNumber: number) => ({
  fightId,
  pullNumber,
  kill: false,
  fightPercentage: 70 - pullNumber * 10,
  durationMs: 60_000,
  stageCount: 1,
  stages: [stage],
  raidDps: 1000,
  raidHps: 200,
  firstDeathMs: 50_000,
  rawDeaths: 2,
  meaningfulDeaths: 1,
  rawDeathTimeline: [
    {
      fightId,
      actorId: 10,
      player: 'Tank',
      fightRelativeMs: 50_000,
      abilityId: 99,
      killingBlow: 'Hit',
      overkill: 1,
    },
  ],
  meaningfulDeathTimeline: [],
  rosterFingerprint: '10-11',
  rosterSize: 2,
});
const payload = (status = 'ready') => ({
  ok: true,
  status,
  generatedAt: 10,
  telemetry: {
    reportCode: 'ABC123XYZ',
    encounter: {
      id: 3010,
      name: 'Test Boss',
      difficulty: 5,
      difficultyName: 'Mythic',
      scopeKey: '3010:d5',
    },
    pullIntelligence: {
      pulls: [pull(1, 1), pull(2, 2)],
      excludedPulls: [
        {
          fightId: 3,
          pullNumber: 3,
          durationMs: 10_000,
          fightPercentage: 99,
          stageCount: 1,
          classification: 'short-reset',
          reason: 'reset',
        },
      ],
      analysisPopulation: { rawPulls: 3, eligiblePulls: 2, excludedPulls: [{}], policy: 'test' },
    },
    evidenceContract: {
      scopeIdentity: 'encounter+difficulty',
      crossDifficultyComparisonForbidden: true,
    },
  },
  mechanics:
    status === 'ready'
      ? {
          observations: [
            {
              fightId: 2,
              key: 'cast',
              name: 'Observed Cast',
              occurrences: 2,
              occurrenceSource: 'cast',
              affectedPlayers: 0,
            },
          ],
          failures: [
            {
              fightId: 2,
              mechanicKey: 'soak',
              mechanicName: 'Soak',
              actorId: 10,
              reason: 'missed',
            },
          ],
        }
      : null,
  evidenceContract: { observedMechanicDoesNotImplyFailure: true },
});

describe('Pull Lab operational API contract', () => {
  it('keeps analytical, excluded, observed and classified populations separate', () => {
    const result = decodePullLabResponse(payload(), scope);
    expect(result.status).toBe('ready');
    expect(result.pulls).toHaveLength(2);
    expect(result.excludedPulls).toHaveLength(1);
    expect(result.mechanics.observations).toHaveLength(1);
    expect(result.mechanics.failures).toHaveLength(1);
    expect(result.pulls[0].stageBands[0].widthPct).toBe(100);
  });

  it('retains telemetry comparison while making gated mechanics explicit', () => {
    const result = decodePullLabResponse(payload('boss-reference-not-ready'), scope);
    expect(result.status).toBe('ready');
    expect(result.mechanics).toMatchObject({ status: 'gated', observations: [], failures: [] });
  });

  it('does not compare a single analytical pull with itself', () => {
    const value = payload();
    value.telemetry.pullIntelligence.pulls = [pull(1, 1)];
    value.telemetry.pullIntelligence.excludedPulls = [];
    value.telemetry.pullIntelligence.analysisPopulation = {
      rawPulls: 1,
      eligiblePulls: 1,
      excludedPulls: [],
      policy: 'test',
    };
    value.mechanics = { observations: [], failures: [] };
    expect(decodePullLabResponse(value, scope).status).toBe('insufficient-data');
  });

  it('rejects exact-scope contradictions', () => {
    const value = payload();
    value.telemetry.encounter.difficulty = 4;
    value.telemetry.encounter.scopeKey = '3010:d4';
    expect(() => decodePullLabResponse(value, scope)).toThrowError(ApiContractError);
  });

  it('rejects population contradictions and failures attached to excluded pulls', () => {
    const inconsistent = payload();
    inconsistent.telemetry.pullIntelligence.analysisPopulation.eligiblePulls = 3;
    expect(() => decodePullLabResponse(inconsistent, scope)).toThrowError(/population contradicts/);
    const excludedFailure = payload();
    excludedFailure.mechanics!.failures[0].fightId = 3;
    expect(() => decodePullLabResponse(excludedFailure, scope)).toThrowError(/excluded pull/);
  });
});
