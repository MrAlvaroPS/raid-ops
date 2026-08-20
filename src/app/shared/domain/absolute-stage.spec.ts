import { absoluteStageBands } from './absolute-stage';

describe('Absolute stage model', () => {
  it('retains repeated semantic phases while ordering by absolute stage', () => {
    const bands = absoluteStageBands(
      [
        {
          absoluteStageIndex: 1,
          semanticPhaseId: 1,
          startTime: 1000,
          endTime: 4000,
          inferred: false,
        },
        {
          absoluteStageIndex: 2,
          semanticPhaseId: 2,
          startTime: 4000,
          endTime: 7000,
          inferred: false,
        },
        {
          absoluteStageIndex: 3,
          semanticPhaseId: 1,
          startTime: 7000,
          endTime: 11000,
          inferred: false,
        },
      ],
      10_000,
    );
    expect(bands.map((band) => band.semanticPhaseId)).toEqual([1, 2, 1]);
    expect(bands.map((band) => band.widthPct)).toEqual([30, 30, 40]);
  });
});
