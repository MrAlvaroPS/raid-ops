import { CompositionPlayer, CompositionSummary, WowClass } from './composition.models';

export const WOW_CLASSES: readonly WowClass[] = Object.freeze([
  { key: 'deathknight', name: 'Death Knight', color: '#c41e3a' },
  { key: 'demonhunter', name: 'Demon Hunter', color: '#a330c9' },
  { key: 'druid', name: 'Druid', color: '#ff7c0a' },
  { key: 'evoker', name: 'Evoker', color: '#33937f' },
  { key: 'hunter', name: 'Hunter', color: '#aad372' },
  { key: 'mage', name: 'Mage', color: '#3fc7eb' },
  { key: 'monk', name: 'Monk', color: '#00ff98' },
  { key: 'paladin', name: 'Paladin', color: '#f48cba' },
  { key: 'priest', name: 'Priest', color: '#ffffff' },
  { key: 'rogue', name: 'Rogue', color: '#fff468' },
  { key: 'shaman', name: 'Shaman', color: '#0070dd' },
  { key: 'warlock', name: 'Warlock', color: '#8788ee' },
  { key: 'warrior', name: 'Warrior', color: '#c69b6d' },
]);

const MELEE_CLASSES = new Set(['deathknight', 'demonhunter', 'monk', 'paladin', 'rogue', 'warrior']);

export function classKey(value: string | null | undefined): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');
}

export function damageRange(player: CompositionPlayer): 'melee' | 'ranged' | null {
  if (player.role !== 'DPS') return null;
  const key = classKey(player.className);
  const spec = classKey(player.spec);
  if (MELEE_CLASSES.has(key)) return 'melee';
  if (key === 'shaman' && ['enhancement', 'enhance', 'mejora'].includes(spec)) return 'melee';
  if (key === 'druid' && spec === 'feral') return 'melee';
  if (key === 'hunter' && ['survival', 'supervivencia'].includes(spec)) return 'melee';
  return key ? 'ranged' : null;
}

export function cleanTalentName(talent: { name: string | null; spellId: number | null }): string | null {
  const name = talent.name?.trim();
  if (name && !/^(?:node|entry|talent)\s*#?\d+$/i.test(name) && !/^\d+$/.test(name)) return name;
  return talent.spellId ? `Spell ${talent.spellId}` : null;
}

export function summarizeComposition(players: readonly CompositionPlayer[]): CompositionSummary {
  const tanks = players.filter(player => player.role === 'TANK').length;
  const healers = players.filter(player => player.role === 'HEAL').length;
  const melee = players.filter(player => damageRange(player) === 'melee').length;
  const ranged = players.filter(player => damageRange(player) === 'ranged').length;
  const classified = tanks + healers + melee + ranged;
  const classKeys = new Set(players.map(player => classKey(player.className)).filter(Boolean));
  const itemLevels = players.map(player => player.itemLevel).filter((value): value is number => value != null && Number.isFinite(value));
  return {
    roster: players.length,
    tanks,
    healers,
    melee,
    ranged,
    unclassified: Math.max(0, players.length - classified),
    classes: classKeys.size,
    averageItemLevel: itemLevels.length ? itemLevels.reduce((sum, value) => sum + value, 0) / itemLevels.length : null,
    missingClasses: WOW_CLASSES.filter(item => !classKeys.has(item.key)),
  };
}

export function playersByClass(players: readonly CompositionPlayer[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const player of players) {
    const key = classKey(player.className);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
