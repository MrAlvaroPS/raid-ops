import { CompositionPlayer } from './composition.models';
import { WOW_CLASSES, cleanTalentName, damageRange, summarizeComposition } from './composition.rules';

function player(overrides: Partial<CompositionPlayer>): CompositionPlayer {
  return {
    actorId: 1, name: 'Player', className: 'Mage', spec: 'Frost', itemLevel: 640, role: 'DPS', server: null,
    bestPull: { dps: 100, hps: 0 },
    character: { gear: [], gearCount: 0, talents: [], talentCount: 0, talentImportCode: null, talentWowheadUrl: null, combatantInfoSource: null },
    reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: null },
    ...overrides,
  };
}

describe('composition rules', () => {
  it('keeps all 13 retail classes in the representation contract', () => {
    expect(WOW_CLASSES).toHaveLength(13);
    expect(new Set(WOW_CLASSES.map(item => item.key)).size).toBe(13);
  });

  it('classifies only explicit DPS and supports melee specializations', () => {
    expect(damageRange(player({ className: 'Shaman', spec: 'Enhancement' }))).toBe('melee');
    expect(damageRange(player({ className: 'Hunter', spec: 'Survival' }))).toBe('melee');
    expect(damageRange(player({ className: 'Mage', spec: 'Frost' }))).toBe('ranged');
    expect(damageRange(player({ className: 'Mage', role: null }))).toBeNull();
  });

  it('preserves unknown roles instead of coercing them to ranged', () => {
    const summary = summarizeComposition([
      player({ actorId: 1, className: 'Warrior', role: 'TANK' }),
      player({ actorId: 2, className: 'Priest', role: 'HEAL' }),
      player({ actorId: 3, className: 'Mage', role: null }),
    ]);
    expect(summary).toMatchObject({ roster: 3, tanks: 1, healers: 1, melee: 0, ranged: 0, unclassified: 1, classes: 3 });
  });

  it('never presents opaque talent node identifiers as names', () => {
    expect(cleanTalentName({ name: 'Node 12345', spellId: null })).toBeNull();
    expect(cleanTalentName({ name: null, spellId: 67890 })).toBe('Spell 67890');
    expect(cleanTalentName({ name: 'Power Infusion', spellId: 10060 })).toBe('Power Infusion');
  });
});
