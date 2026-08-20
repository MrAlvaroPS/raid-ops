import { PullFact } from './pull-lab.models';
import { comparePulls, deathPosition } from './pull-lab.rules';

const pull = (overrides: Partial<PullFact> = {}): PullFact => ({
  fightId: 2,
  pullNumber: 2,
  kill: false,
  fightPercentage: 40,
  durationMs: 100_000,
  stageCount: 2,
  stages: [],
  stageBands: [],
  raidDps: 1000,
  raidHps: 200,
  firstDeathMs: 80_000,
  rawDeaths: 4,
  meaningfulDeaths: 2,
  rawDeathTimeline: [],
  meaningfulDeathTimeline: [],
  rosterFingerprint: '1-2',
  rosterSize: 2,
  ...overrides,
});

describe('Pull Lab comparison rules', () => {
  it('classifies progress and same-stage DPS but keeps HPS observational', () => {
    const comparison = comparePulls(
      pull(),
      pull({ fightId: 1, pullNumber: 1, fightPercentage: 55, raidDps: 900, raidHps: 100 }),
    );
    expect(comparison.signals.find((row) => row.key === 'progress')?.status).toBe('improved');
    expect(comparison.signals.find((row) => row.key === 'raidDps')?.status).toBe('improved');
    expect(comparison.signals.find((row) => row.key === 'raidHps')?.status).toBe('observed');
  });

  it('refuses a directional DPS label across different absolute stages', () => {
    const comparison = comparePulls(
      pull({ raidDps: 1200 }),
      pull({ fightId: 1, pullNumber: 1, stageCount: 1, raidDps: 800 }),
    );
    expect(comparison.sameStage).toBe(false);
    expect(comparison.signals.find((row) => row.key === 'raidDps')?.status).toBe('observed');
  });

  it('treats no friendly death as better than a recorded first death', () => {
    const comparison = comparePulls(
      pull({ firstDeathMs: null }),
      pull({ fightId: 1, pullNumber: 1, firstDeathMs: 40_000 }),
    );
    expect(comparison.signals.find((row) => row.key === 'firstDeath')?.status).toBe('improved');
  });

  it('clamps death markers to the pull duration', () => {
    expect(
      deathPosition(
        {
          fightId: 1,
          actorId: null,
          player: null,
          fightRelativeMs: 120_000,
          abilityId: null,
          killingBlow: null,
          overkill: null,
        },
        100_000,
      ),
    ).toBe(100);
  });
});
