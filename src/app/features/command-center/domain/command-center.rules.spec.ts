import { chartPoints, compareLatestPulls, deepestStage, stageReach } from './command-center.rules';

const pull = (overrides: Record<string, unknown> = {}) => ({
  fightId: 1,
  pullNumber: 1,
  kill: false,
  fightPercentage: 60,
  durationMs: 100_000,
  stageCount: 1,
  meaningfulDeaths: 3,
  raidDps: 1_000_000,
  rosterFingerprint: '1-2-3',
  ...overrides,
});

describe('Command Center rules', () => {
  it('compares only the latest completed pull with its previous eligible pull', () => {
    const result = compareLatestPulls(
      pull({ fightId: 2, pullNumber: 2, fightPercentage: 30, meaningfulDeaths: 1 }),
      pull(),
    );
    expect(result?.currentPull).toBe(2);
    expect(result?.signals.find((signal) => signal.key === 'progress')?.status).toBe('improved');
    expect(result?.signals.find((signal) => signal.key === 'meaningfulDeaths')?.status).toBe(
      'improved',
    );
  });

  it('keeps cross-stage DPS observational and roster change non-causal', () => {
    const result = compareLatestPulls(
      pull({ fightId: 2, pullNumber: 2, stageCount: 2, rosterFingerprint: '1-2-4' }),
      pull(),
    );
    expect(result?.rosterChanged).toBe(true);
    expect(result?.signals.find((signal) => signal.key === 'raidDps')?.status).toBe('observed');
  });

  it('builds raw chronological progress geometry and absolute stage reach', () => {
    const pulls = [
      pull(),
      pull({ fightId: 2, pullNumber: 2, fightPercentage: 20, stageCount: 2 }),
      pull({ fightId: 3, pullNumber: 3, fightPercentage: 0, stageCount: 3, kill: true }),
    ];
    expect(chartPoints(pulls)).toBe('0.00,60.00 50.00,20.00 100.00,0.00');
    expect(deepestStage(pulls)).toBe(3);
    expect(stageReach(pulls, 2)).toEqual({ reached: 2, total: 3, percent: 200 / 3 });
  });
});
