import { chartPoints, relativeStageWidth, stageBands } from './damage-healing.rules';

describe('Damage & Healing domain rules', () => {
  it('maps valid ordered buckets without changing their order', () => {
    const points = chartPoints([10, 40, 20]);
    expect(points.map(point => point.x)).toEqual([2, 50, 98]);
    expect(points[1].y).toBeLessThan(points[0].y);
    expect(points[2].y).toBeGreaterThan(points[1].y);
  });

  it('refuses incomplete or invalid graph series', () => {
    expect(chartPoints([10])).toEqual([]);
    expect(chartPoints([10, -1])).toEqual([]);
  });

  it('uses measured absolute stage windows and retains repeated semantic phases', () => {
    const bands = stageBands([
      { absoluteStageIndex: 1, semanticPhaseId: 1, startTime: 1000, endTime: 4000, inferred: false },
      { absoluteStageIndex: 2, semanticPhaseId: 2, startTime: 4000, endTime: 7000, inferred: false },
      { absoluteStageIndex: 3, semanticPhaseId: 1, startTime: 7000, endTime: 11000, inferred: false },
    ], 10_000);
    expect(bands.map(band => band.semanticPhaseId)).toEqual([1, 2, 1]);
    expect(bands.map(band => band.widthPct)).toEqual([30, 30, 40]);
  });

  it('normalizes stage bars only against the same selected metric', () => {
    expect(relativeStageWidth(50, [50, 100, null])).toBe(50);
    expect(relativeStageWidth(null, [50, 100])).toBe(0);
  });
});
