import { PullComparison, PullComparisonSignal, PullDeath, PullFact } from './pull-lab.models';

function finite(value: number | null): value is number {
  return value != null && Number.isFinite(value);
}

function signal(
  key: PullComparisonSignal['key'],
  label: string,
  current: number | null,
  baseline: number | null,
  unit: PullComparisonSignal['unit'],
  better: 'higher' | 'lower',
  allowDirection: boolean,
  evidence: string,
): PullComparisonSignal {
  if (!finite(current) || !finite(baseline))
    return { key, label, status: 'unavailable', current, baseline, delta: null, unit, evidence };
  const delta = current - baseline;
  const status = !allowDirection
    ? 'observed'
    : Math.abs(delta) < 1e-9
      ? 'stable'
      : (better === 'higher' ? delta > 0 : delta < 0)
        ? 'improved'
        : 'regressed';
  return { key, label, status, current, baseline, delta, unit, evidence };
}

function firstDeath(current: number | null, baseline: number | null): PullComparisonSignal {
  const base = { key: 'firstDeath' as const, label: 'First death', unit: 'ms' as const };
  if (!finite(current) && !finite(baseline))
    return {
      ...base,
      status: 'stable',
      current: null,
      baseline: null,
      delta: 0,
      evidence: 'No friendly death event in either pull.',
    };
  if (!finite(current) && finite(baseline))
    return {
      ...base,
      status: 'improved',
      current: null,
      baseline,
      delta: baseline,
      evidence: 'Pull A has no friendly death event.',
    };
  if (finite(current) && !finite(baseline))
    return {
      ...base,
      status: 'regressed',
      current,
      baseline: null,
      delta: -current,
      evidence: 'Pull B has no friendly death event.',
    };
  return signal(
    'firstDeath',
    'First death',
    current,
    baseline,
    'ms',
    'higher',
    true,
    'First friendly death event in each pull.',
  );
}

export function comparePulls(pullA: PullFact, pullB: PullFact): PullComparison {
  const sameStage = pullA.stageCount === pullB.stageCount;
  return {
    pullA,
    pullB,
    sameStage,
    rosterChanged: pullA.rosterFingerprint !== pullB.rosterFingerprint,
    signals: [
      signal(
        'progress',
        'Boss remaining',
        pullA.fightPercentage,
        pullB.fightPercentage,
        'pp',
        'lower',
        true,
        'WCL fightPercentage; lower means deeper progression.',
      ),
      signal(
        'duration',
        'Duration',
        pullA.durationMs,
        pullB.durationMs,
        'ms',
        'higher',
        false,
        'Observed duration; longer is not inherently better.',
      ),
      signal(
        'stage',
        'Stage reached',
        pullA.stageCount,
        pullB.stageCount,
        'stage',
        'higher',
        true,
        'Ordered absolute-stage model.',
      ),
      firstDeath(pullA.firstDeathMs, pullB.firstDeathMs),
      signal(
        'meaningfulDeaths',
        'Meaningful deaths',
        pullA.meaningfulDeaths,
        pullB.meaningfulDeaths,
        'deaths',
        'lower',
        true,
        'WCL deaths before the wipe cutoff.',
      ),
      signal(
        'raidDps',
        'Raid DPS',
        pullA.raidDps,
        pullB.raidDps,
        'dps',
        'higher',
        sameStage,
        sameStage
          ? 'WCL Summary; same absolute stage reached.'
          : 'Observed only because pulls reached different stages.',
      ),
      signal(
        'raidHps',
        'Raid HPS',
        pullA.raidHps,
        pullB.raidHps,
        'hps',
        'higher',
        false,
        'Observed only; HPS depends on healing demand.',
      ),
    ],
  };
}

export function deathPosition(death: PullDeath, durationMs: number): number | null {
  if (death.fightRelativeMs == null || durationMs <= 0) return null;
  return Math.max(0, Math.min(100, (death.fightRelativeMs * 100) / durationMs));
}

export function isMeaningfulDeath(death: PullDeath, meaningful: readonly PullDeath[]): boolean {
  return meaningful.some(
    (item) => item.actorId === death.actorId && item.fightRelativeMs === death.fightRelativeMs,
  );
}
