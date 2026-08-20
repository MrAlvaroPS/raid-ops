import {
  ProgressChartPoint,
  ProgressChartSeries,
  ProgressDepthSummary,
  ProgressModel,
  ProgressPull,
  ProgressRange,
  ProgressScope,
} from './progress.models';

const finite = (value: number | null): value is number => value != null && Number.isFinite(value);

export function parseProgressScope(
  encounter: string | null,
  difficulty: string | null,
): ProgressScope | null {
  const encounterId = Number(encounter);
  const difficultyId = Number(difficulty);
  if (
    !Number.isInteger(encounterId) ||
    encounterId <= 0 ||
    !Number.isInteger(difficultyId) ||
    difficultyId <= 0
  )
    return null;
  return { encounterId, difficulty: difficultyId, scopeKey: `${encounterId}:d${difficultyId}` };
}

export function progressValue(pull: ProgressPull): number | null {
  if (pull.kill) return 0;
  return finite(pull.fightPercentage) && pull.fightPercentage >= 0 && pull.fightPercentage <= 100
    ? pull.fightPercentage
    : null;
}

export function isDepthMeasured(pull: ProgressPull): boolean {
  const value = progressValue(pull);
  return pull.progressMetricEligible && value != null && (pull.kill || value < 99.999);
}

export function summarizeProgressDepth(
  pulls: readonly ProgressPull[],
  model: ProgressModel,
): ProgressDepthSummary {
  const eligible = pulls.filter((pull) => pull.progressMetricEligible);
  const measured = pulls.filter(isDepthMeasured);
  const unmeasuredEligible = eligible.filter((pull) => !isDepthMeasured(pull));
  const coveragePct = pulls.length ? (measured.length * 100) / pulls.length : null;
  return {
    measured,
    eligible,
    unmeasuredEligible,
    coveragePct,
    limited:
      model.dataQuality.grade === 'REVIEW' ||
      model.dataQuality.grade === 'BLOCKED' ||
      (coveragePct != null && coveragePct < 65),
  };
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function point(
  value: number,
  index: number,
  length: number,
  pullNumber: number,
  personalBest = false,
): ProgressChartPoint {
  return {
    pullNumber,
    x: length === 1 ? 50 : 3 + (index / (length - 1)) * 94,
    y: 6 + (Math.max(0, Math.min(100, value)) / 100) * 72,
    value,
    personalBest,
  };
}

export function progressChartSeries(
  pulls: readonly ProgressPull[],
  range: ProgressRange,
): ProgressChartSeries {
  const limit = range === 'all' ? pulls.length : Number(range);
  const visible = pulls.slice(-limit);
  if (!visible.length)
    return {
      visible,
      measured: [],
      bestLine: [],
      formLine: [],
      unmeasured: [],
      nightBoundaries: [],
    };
  const first = visible[0].pullNumber;
  const before = pulls.filter((pull) => pull.pullNumber < first && isDepthMeasured(pull));
  let runningBest = before.length
    ? Math.min(...before.map((pull) => progressValue(pull)!))
    : Number.POSITIVE_INFINITY;
  const bestLine: ProgressChartPoint[] = [];
  const measured: ProgressChartPoint[] = [];
  const history = before.slice(-5).map((pull) => progressValue(pull)!);
  const formLine: ProgressChartPoint[] = [];
  visible.forEach((pull, index) => {
    if (!isDepthMeasured(pull)) return;
    const value = progressValue(pull)!;
    const personalBest = value < runningBest;
    if (personalBest) runningBest = value;
    const measuredPoint = point(value, index, visible.length, pull.pullNumber, personalBest);
    measured.push(measuredPoint);
    history.push(value);
    if (history.length > 5) history.shift();
    formLine.push(point(median(history)!, index, visible.length, pull.pullNumber));
  });
  visible.forEach((pull, index) => {
    const value = isDepthMeasured(pull) ? progressValue(pull)! : null;
    if (value != null && value <= runningBest) runningBest = Math.min(runningBest, value);
  });
  runningBest = before.length
    ? Math.min(...before.map((pull) => progressValue(pull)!))
    : Number.POSITIVE_INFINITY;
  visible.forEach((pull, index) => {
    const value = isDepthMeasured(pull) ? progressValue(pull)! : null;
    if (value != null) runningBest = Math.min(runningBest, value);
    if (Number.isFinite(runningBest))
      bestLine.push(point(runningBest, index, visible.length, pull.pullNumber));
  });
  const unmeasured = visible.flatMap((pull, index) =>
    pull.progressMetricEligible && !isDepthMeasured(pull)
      ? [{ pullNumber: pull.pullNumber, x: point(100, index, visible.length, pull.pullNumber).x }]
      : [],
  );
  const nightBoundaries = visible.flatMap((pull, index) =>
    index > 0 && pull.sessionId !== visible[index - 1].sessionId
      ? [point(0, index - 0.5, visible.length, pull.pullNumber).x]
      : [],
  );
  return { visible, measured, bestLine, formLine, unmeasured, nightBoundaries };
}

export function stageReachForNight(
  pulls: readonly ProgressPull[],
  sessionId: string,
  deepestStage: number,
): number | null {
  const eligible = pulls.filter(
    (pull) => pull.sessionId === sessionId && pull.progressMetricEligible,
  );
  return eligible.length
    ? (eligible.filter((pull) => pull.stageCount >= deepestStage).length * 100) / eligible.length
    : null;
}

export function measuredBestForNight(
  pulls: readonly ProgressPull[],
  sessionId: string,
): number | null {
  const values = pulls
    .filter((pull) => pull.sessionId === sessionId && isDepthMeasured(pull))
    .map((pull) => progressValue(pull)!);
  return values.length ? Math.min(...values) : null;
}
