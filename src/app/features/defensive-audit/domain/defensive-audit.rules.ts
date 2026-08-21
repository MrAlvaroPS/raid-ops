import {
  DefensiveAuditFilter,
  DefensiveAuditSnapshot,
  DefensiveDeathChain,
  DefensiveParticipant,
} from './defensive-audit.models';

export function filterParticipants(
  participants: readonly DefensiveParticipant[],
  filter: DefensiveAuditFilter,
): readonly DefensiveParticipant[] {
  if (filter === 'deaths')
    return participants.filter(
      (participant) => participant.meaningfulDeaths != null && participant.meaningfulDeaths > 0,
    );
  if (filter === 'linked')
    return participants.filter((participant) => participant.linkedChains > 0);
  return participants;
}

export function latestDeathChain(
  chains: readonly DefensiveDeathChain[],
): DefensiveDeathChain | null {
  return [...chains].sort((a, b) => b.deathAtMs - a.deathAtMs)[0] ?? null;
}

export function findDeathChain(
  chains: readonly DefensiveDeathChain[],
  key: string | null,
): DefensiveDeathChain | null {
  return chains.find((chain) => chain.key === key) ?? latestDeathChain(chains);
}

export function hasObservedEvidence(snapshot: DefensiveAuditSnapshot): boolean {
  return (
    snapshot.deathCounts.raw > 0 ||
    snapshot.observedConsumables.healthstones > 0 ||
    snapshot.observedConsumables.potions > 0
  );
}

export function participantLabel(participant: DefensiveParticipant): string {
  return [participant.spec, participant.role].filter(Boolean).join(' · ') || 'Unclassified';
}
