import { absoluteStageBands } from '../../../shared/domain/absolute-stage';
import { AbsoluteStage, ChartPoint, StageBand, StageThroughput, ThroughputMode } from './damage-healing.models';

export function chartPoints(values: readonly number[], width = 100, height = 42): readonly ChartPoint[] {
  if (values.length < 2 || values.some(value => !Number.isFinite(value) || value < 0)) return [];
  const maximum = Math.max(...values, 1);
  return values.map((value, index) => ({
    x: 2 + index * (width - 4) / (values.length - 1),
    y: height - 4 - value * (height - 8) / maximum,
  }));
}

export function chartPolyline(values: readonly number[]): string {
  return chartPoints(values).map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

export function chartArea(values: readonly number[]): string {
  const line = chartPoints(values);
  return line.length ? `2,38 ${line.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')} 98,38` : '';
}

export function stageBands(stages: readonly AbsoluteStage[], durationMs: number): readonly StageBand[] {
  return absoluteStageBands(stages, durationMs);
}

export function stageMetric(stage: StageThroughput, mode: ThroughputMode): number | null {
  if (!stage.available) return null;
  return mode === 'damage' ? stage.dps : stage.hps;
}

export function relativeStageWidth(value: number | null, values: readonly (number | null)[]): number {
  if (value == null || value < 0) return 0;
  const maximum = Math.max(...values.filter((item): item is number => item != null && item >= 0), 1);
  return Math.max(2, value * 100 / maximum);
}
