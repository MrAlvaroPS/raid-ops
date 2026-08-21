import {
  filterParticipants,
  findDeathChain,
  latestDeathChain,
  participantLabel,
} from './defensive-audit.rules';

const participants = [
  {
    actorId: 1,
    name: 'A',
    className: null,
    spec: 'Holy',
    role: 'HEAL',
    source: 'best-pull-roster' as const,
    rawDeaths: 2,
    meaningfulDeaths: 1,
    firstDeaths: 0,
    observedHealthstones: 1,
    observedPotions: 0,
    linkedChains: 1,
  },
  {
    actorId: 2,
    name: 'B',
    className: null,
    spec: null,
    role: null,
    source: 'best-pull-roster' as const,
    rawDeaths: 0,
    meaningfulDeaths: 0,
    firstDeaths: 0,
    observedHealthstones: 0,
    observedPotions: 0,
    linkedChains: 0,
  },
];
const chains = [
  {
    key: '1:1:100',
    fightId: 1,
    actorId: 1,
    player: 'A',
    deathAtMs: 100,
    fightRelativeMs: 50,
    killingBlow: null,
    confidence: 'unknown',
    probableCause: null,
    evidence: [],
  },
  {
    key: '2:1:200',
    fightId: 2,
    actorId: 1,
    player: 'A',
    deathAtMs: 200,
    fightRelativeMs: 70,
    killingBlow: null,
    confidence: 'medium',
    probableCause: null,
    evidence: [],
  },
];

describe('Defensive Audit rules', () => {
  it('filters only on observed death or linked-chain evidence', () => {
    expect(filterParticipants(participants, 'deaths').map((row) => row.actorId)).toEqual([1]);
    expect(filterParticipants(participants, 'linked').map((row) => row.actorId)).toEqual([1]);
    expect(filterParticipants(participants, 'all')).toHaveLength(2);
  });

  it('uses a stable explicit chain and otherwise selects the latest death', () => {
    expect(findDeathChain(chains, '1:1:100')?.fightId).toBe(1);
    expect(findDeathChain(chains, 'missing')?.fightId).toBe(2);
    expect(latestDeathChain([])).toBeNull();
  });

  it('does not invent a role for an unclassified participant', () => {
    expect(participantLabel(participants[1])).toBe('Unclassified');
  });
});
