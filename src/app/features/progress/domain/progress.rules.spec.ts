import { ProgressModel, ProgressPull } from './progress.models';
import {
  isDepthMeasured,
  parseProgressScope,
  progressChartSeries,
  summarizeProgressDepth,
} from './progress.rules';

const pull = (
  pullNumber: number,
  fightPercentage: number | null,
  eligible = true,
  sessionId = 'n1',
): ProgressPull => ({
  pullNumber,
  globalPullNumber: pullNumber,
  sessionId,
  sessionIndex: sessionId === 'n1' ? 1 : 2,
  absoluteStartTime: pullNumber * 1000,
  absoluteEndTime: pullNumber * 1000 + 500,
  durationMs: 500,
  kill: fightPercentage === 0,
  fightPercentage,
  bossPercentage: fightPercentage,
  stageCount: pullNumber > 2 ? 2 : 1,
  progressMetricEligible: eligible,
  progressMetricReason: eligible ? 'wcl-fight-percentage' : 'contradiction',
  progressMetricSeverity: eligible ? 'confirmed' : 'error',
  progressMetricFlags: [],
  reportCodes: ['A'],
  fightIds: [pullNumber],
});

const model = (grade: 'GOOD' | 'PARTIAL' | 'REVIEW' | 'BLOCKED' = 'GOOD') =>
  ({ dataQuality: { grade } }) as ProgressModel;

describe('Progress presentation rules', () => {
  it('requires an explicit encounter+difficulty scope without Active Report', () => {
    expect(parseProgressScope('3010', '5')).toEqual({
      encounterId: 3010,
      difficulty: 5,
      scopeKey: '3010:d5',
    });
    expect(parseProgressScope('3010', null)).toBeNull();
    expect(parseProgressScope('0', '5')).toBeNull();
  });

  it('keeps exact 100 and excluded rows raw without pretending that they are measured depth', () => {
    const rows = [pull(1, 100), pull(2, 82), pull(3, 100, false), pull(4, 0)];
    expect(isDepthMeasured(rows[0])).toBe(false);
    expect(isDepthMeasured(rows[1])).toBe(true);
    expect(isDepthMeasured(rows[2])).toBe(false);
    expect(isDepthMeasured(rows[3])).toBe(true);
    const summary = summarizeProgressDepth(rows, model());
    expect(summary.measured).toHaveLength(2);
    expect(summary.unmeasuredEligible).toHaveLength(1);
    expect(summary.coveragePct).toBe(50);
    expect(summary.limited).toBe(true);
  });

  it('treats REVIEW/BLOCKED as limited even with broad measured coverage', () => {
    const rows = [pull(1, 90), pull(2, 80), pull(3, 70)];
    expect(summarizeProgressDepth(rows, model('REVIEW')).limited).toBe(true);
    expect(summarizeProgressDepth(rows, model('GOOD')).limited).toBe(false);
  });

  it('applies raw range only to chart presentation and preserves unmeasured x positions', () => {
    const rows = [
      pull(1, 90, true, 'n1'),
      pull(2, 100, true, 'n1'),
      pull(3, 70, true, 'n2'),
      pull(4, 65, true, 'n2'),
    ];
    const chart = progressChartSeries(rows, '25');
    expect(chart.visible).toHaveLength(4);
    expect(chart.measured).toHaveLength(3);
    expect(chart.unmeasured.map((row) => row.pullNumber)).toEqual([2]);
    expect(chart.nightBoundaries).toHaveLength(1);
    expect(chart.bestLine.at(-1)?.value).toBe(65);
    expect(
      progressChartSeries(
        Array.from({ length: 30 }, (_, index) => pull(index + 1, 99 - index)),
        '25',
      ).visible[0].pullNumber,
    ).toBe(6);
  });
});
