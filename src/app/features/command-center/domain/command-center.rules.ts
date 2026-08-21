import {
  CommandCenterComparison,
  CommandCenterPull,
  CommandCenterSignal,
} from './command-center.models';

function directionalSignal(
  key: CommandCenterSignal['key'],
  label: string,
  current: number | null,
  baseline: number | null,
  unit: CommandCenterSignal['unit'],
  better: 'higher' | 'lower',
  allowDirection: boolean,
  evidence: string,
): CommandCenterSignal {
  if (current == null || baseline == null)
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

export function compareLatestPulls(
  latest: CommandCenterPull | null,
  previous: CommandCenterPull | null,
): CommandCenterComparison | null {
  if (!latest || !previous) return null;
  const sameStage = latest.stageCount === previous.stageCount;
  return {
    currentPull: latest.pullNumber,
    baselinePull: previous.pullNumber,
    rosterChanged: latest.rosterFingerprint !== previous.rosterFingerprint,
    signals: [
      directionalSignal(
        'progress',
        'Boss remaining',
        latest.fightPercentage,
        previous.fightPercentage,
        'pp',
        'lower',
        true,
        'WCL fightPercentage; lower means deeper report progression.',
      ),
      directionalSignal(
        'stage',
        'Stage reached',
        latest.stageCount,
        previous.stageCount,
        'stage',
        'higher',
        true,
        'Ordered absolute-stage model for this exact encounter and difficulty.',
      ),
      directionalSignal(
        'meaningfulDeaths',
        'Meaningful deaths',
        latest.meaningfulDeaths,
        previous.meaningfulDeaths,
        'deaths',
        'lower',
        true,
        'WCL deaths before the wipe cutoff.',
      ),
      directionalSignal(
        'raidDps',
        'Raid DPS',
        latest.raidDps,
        previous.raidDps,
        'dps',
        'higher',
        sameStage,
        sameStage
          ? 'WCL Summary; both pulls reached the same absolute stage.'
          : 'Observed only because the pulls reached different stages.',
      ),
    ],
  };
}

export function chartPoints(pulls: readonly CommandCenterPull[]): string {
  if (!pulls.length) return '';
  const width = 100;
  return pulls
    .map((pull, index) => {
      const x = pulls.length === 1 ? width / 2 : (index * width) / (pulls.length - 1);
      const y = pull.kill ? 0 : Math.max(0, Math.min(100, pull.fightPercentage ?? 100));
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function deepestStage(pulls: readonly CommandCenterPull[]): number {
  return pulls.reduce((maximum, pull) => Math.max(maximum, pull.stageCount), 0);
}

export function stageReach(
  pulls: readonly CommandCenterPull[],
  stage: number,
): { readonly reached: number; readonly total: number; readonly percent: number | null } {
  if (!pulls.length) return { reached: 0, total: 0, percent: null };
  const reached = pulls.filter((pull) => pull.stageCount >= stage).length;
  return { reached, total: pulls.length, percent: (reached * 100) / pulls.length };
}
