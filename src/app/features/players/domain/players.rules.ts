import {
  PlayerAttendance,
  PlayersPlayer,
  ReliabilityComponent,
  ReliabilityProfile,
} from './players.models';

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

export function isReliabilityPublished(profile: ReliabilityProfile | null): boolean {
  return profile?.status === 'published' && profile.value != null && Number.isFinite(profile.value);
}

export function publicReliabilityValue(profile: ReliabilityProfile | null): number | null {
  return isReliabilityPublished(profile) ? profile!.value : null;
}

export function publicComponentValue(
  profile: ReliabilityProfile | null,
  component: ReliabilityComponent,
): number | null {
  return isReliabilityPublished(profile) && component.status === 'scored' && component.value != null
    ? component.value
    : null;
}

export function rosterReliability(players: readonly PlayersPlayer[]): {
  value: number | null;
  published: number;
} {
  const values = players
    .map((player) => publicReliabilityValue(player.reliability))
    .filter((value): value is number => value != null);
  return {
    value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    published: values.length,
  };
}

export function attendanceIdentityKey(name: string, server: string | null): string | null {
  return normalize(server) && normalize(name) ? `${normalize(server)}:${normalize(name)}` : null;
}

export function joinAttendance(
  player: Pick<PlayersPlayer, 'name' | 'server'>,
  rows: readonly PlayerAttendance[],
): PlayerAttendance | null {
  const key = attendanceIdentityKey(player.name, player.server);
  if (!key) return null;
  return rows.find((row) => normalize(row.identityKey) === key) ?? null;
}

export function roleLabel(role: PlayersPlayer['role']): string {
  if (role === 'TANK') return 'Tank';
  if (role === 'HEAL') return 'Healer';
  if (role === 'DPS') return 'DPS';
  return 'Unclassified';
}

export function outputLabel(player: PlayersPlayer): string {
  if (player.bestPullOutput == null || !player.outputUnit) return '—';
  return `${Math.round(player.bestPullOutput).toLocaleString('en-US')} ${player.outputUnit}`;
}
